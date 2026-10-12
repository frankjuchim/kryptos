'use strict';
// Lehrkraft-Konten: Registrierung auf Anfrage, Freigabe durch Superadmin, Login, Passwortwechsel, Einmal-Passwort.

const V = require('../validate');
const S = require('../security');

const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = V;

function createKonten(ctx) {
  const { db } = ctx;
  const iso = () => new Date(ctx.now()).toISOString();

  function row(id) {
    return db.prepare('SELECT * FROM lehrkraefte WHERE id = ?').get(id);
  }

  function ansicht(r) {
    if (!r) return null;
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      schule: r.schule,
      nachricht: r.nachricht,
      rolle: r.rolle,
      status: r.status,
      mussPasswortAendern: r.muss_pw_aendern === 1,
      erstellt: r.created_at,
      entschieden: r.entschieden_at,
      letzterLogin: r.last_login_at,
      portal: !!r.sub
    };
  }

  /**
   * Superadmin aus den Umgebungsvariablen anlegen bzw. aktualisieren.
   * Ohne ADMIN_PASSWORD bleibt ein vorhandenes Konto bestehen, der Login ist dann aber gesperrt.
   */
  function sichereSuperadmin(email, passwort) {
    const mail = String(email || 'admin').trim().toLowerCase() || 'admin';
    const vorhanden = db.prepare("SELECT * FROM lehrkraefte WHERE rolle = 'superadmin' AND sub IS NULL ORDER BY id LIMIT 1").get();
    if (!passwort) return vorhanden ? vorhanden.id : null;
    const konflikt = db.prepare("SELECT * FROM lehrkraefte WHERE email = ? AND rolle != 'superadmin' AND sub IS NULL").get(mail);
    if (konflikt) {
      // Eine normale Lehrkraft mit derselben Adresse wird zum Superadmin hochgestuft.
      db.prepare("UPDATE lehrkraefte SET rolle = 'superadmin', status = 'aktiv' WHERE id = ?").run(konflikt.id);
      if (vorhanden) db.prepare('DELETE FROM lehrkraefte WHERE id = ?').run(vorhanden.id);
      return sichereSuperadmin(mail, passwort);
    }
    if (!vorhanden) {
      const info = db
        .prepare(
          "INSERT INTO lehrkraefte (email, name, schule, pw_hash, rolle, status, created_at, entschieden_at) VALUES (?, 'Superadmin', '', ?, 'superadmin', 'aktiv', ?, ?)"
        )
        .run(mail, S.hashPasswortSync(passwort), iso(), iso());
      return Number(info.lastInsertRowid);
    }
    const upd = [];
    if (vorhanden.email !== mail) upd.push(['email', mail]);
    if (!S.pruefePasswortSync(passwort, vorhanden.pw_hash)) {
      upd.push(['pw_hash', S.hashPasswortSync(passwort)]);
      upd.push(['session_gen', vorhanden.session_gen + 1]);
      upd.push(['muss_pw_aendern', 0]);
    }
    if (vorhanden.status !== 'aktiv') upd.push(['status', 'aktiv']);
    for (const [k, v] of upd) db.prepare(`UPDATE lehrkraefte SET ${k} = ? WHERE id = ?`).run(v, vorhanden.id);
    return vorhanden.id;
  }

  async function registrieren(input) {
    const b = input || {};
    const name = V.str(b.name, 'Name', { min: 2, max: 80 });
    const email = V.email(b.email);
    const schule = V.str(b.schule, 'Schule', { min: 2, max: 120 });
    const nachricht = V.str(b.nachricht === undefined ? '' : b.nachricht, 'Nachricht', { max: 1000 });
    const pw = V.passwort(b.passwort);
    if (db.prepare('SELECT 1 FROM lehrkraefte WHERE email = ?').get(email)) {
      throw new ConflictError('Für diese E-Mail-Adresse gibt es bereits ein Konto oder eine Anfrage.');
    }
    const hash = await S.hashPasswort(pw);
    const info = db
      .prepare("INSERT INTO lehrkraefte (email, name, schule, nachricht, pw_hash, rolle, status, created_at) VALUES (?, ?, ?, ?, ?, 'lehrkraft', 'wartet', ?)")
      .run(email, name, schule, nachricht, hash, iso());
    return ansicht(row(info.lastInsertRowid));
  }

  /**
   * Login prüfen. Liefert das Konto oder wirft (401 falsche Daten, 403 Status).
   * @param {{superadminAktiv: boolean}} opt
   */
  async function anmelden(email, passwort, opt) {
    const mail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const pw = typeof passwort === 'string' ? passwort : '';
    const r = mail ? db.prepare('SELECT * FROM lehrkraefte WHERE email = ?').get(mail) : null;
    const ok = await S.pruefePasswort(pw, r ? r.pw_hash : null);
    if (!r || !ok) {
      const e = new Error('E-Mail oder Passwort falsch.');
      e.status = 401;
      throw e;
    }
    if (r.rolle === 'superadmin' && !opt.superadminAktiv) throw new ForbiddenError('Der Superadmin-Login ist deaktiviert (ADMIN_PASSWORD nicht gesetzt).');
    if (r.status === 'wartet') throw new ForbiddenError('Ihre Registrierung wartet noch auf die Freigabe durch den Administrator.');
    if (r.status === 'abgelehnt') throw new ForbiddenError('Ihre Registrierung wurde abgelehnt.');
    if (r.status === 'deaktiviert') throw new ForbiddenError('Ihr Konto ist deaktiviert. Bitte wenden Sie sich an den Administrator.');
    db.prepare('UPDATE lehrkraefte SET last_login_at = ? WHERE id = ?').run(iso(), r.id);
    return row(r.id);
  }

  /** Konto zur Session (null, wenn ungültig/gesperrt/abgemeldet). */
  function ausSession(id, gen, opt) {
    const r = row(id);
    if (!r || r.session_gen !== gen || r.status !== 'aktiv') return null;
    // Superadmin aus dem Portal (sub a:<n>) braucht kein ADMIN_PASSWORD
    if (r.rolle === 'superadmin' && !r.sub && !opt.superadminAktiv) return null;
    if (r.sub && opt.portalAktiv === false) return null;
    return r;
  }

  async function passwortAendern(id, alt, neu) {
    const r = row(id);
    if (!r) throw new NotFoundError('Konto nicht gefunden.');
    if (r.sub) throw new ForbiddenError('Ihr Passwort ändern Sie im Portal.');
    if (!(await S.pruefePasswort(typeof alt === 'string' ? alt : '', r.pw_hash))) throw new ValidationError('Das bisherige Passwort ist falsch.');
    const pw = V.passwort(neu, 'Neues Passwort');
    if (pw === alt) throw new ValidationError('Das neue Passwort muss sich vom bisherigen unterscheiden.');
    if (r.rolle === 'superadmin') throw new ForbiddenError('Das Superadmin-Passwort wird über die Umgebungsvariable ADMIN_PASSWORD festgelegt.');
    const hash = await S.hashPasswort(pw);
    db.prepare('UPDATE lehrkraefte SET pw_hash = ?, muss_pw_aendern = 0, session_gen = session_gen + 1 WHERE id = ?').run(hash, id);
    return row(id);
  }

  /* ---------- Superadmin-Funktionen ---------- */

  function liste() {
    return db
      .prepare(
        `SELECT l.*,
           (SELECT COUNT(*) FROM kurse k WHERE (k.portal_id IS NULL AND k.lehrkraft_id = l.id)
              OR k.id IN (SELECT kurs_id FROM kurs_lehrkraefte x WHERE x.lehrkraft_id = l.id)) AS kurse,
           (SELECT COUNT(*) FROM schueler s JOIN kurse k ON k.id = s.kurs_id WHERE (k.portal_id IS NULL AND k.lehrkraft_id = l.id)
              OR k.id IN (SELECT kurs_id FROM kurs_lehrkraefte x WHERE x.lehrkraft_id = l.id)) AS schueler
         FROM lehrkraefte l WHERE l.sub IS NULL OR l.sub != 'portal'
         ORDER BY CASE l.status WHEN 'wartet' THEN 0 WHEN 'aktiv' THEN 1 WHEN 'deaktiviert' THEN 2 ELSE 3 END, l.created_at DESC`
      )
      .all()
      .map((r) => ({ ...ansicht(r), kurse: r.kurse, schueler: r.schueler }));
  }

  function normalesKonto(id) {
    const r = row(id);
    if (!r) throw new NotFoundError('Lehrkraft nicht gefunden.');
    if (r.rolle === 'superadmin') throw new ForbiddenError('Der Superadmin kann hier nicht geändert werden.');
    if (r.sub) throw new ForbiddenError('Konten aus dem Portal werden im Portal verwaltet.');
    return r;
  }

  function setzeStatus(id, status) {
    const r = normalesKonto(id);
    const erlaubt = {
      aktiv: ['wartet', 'deaktiviert', 'abgelehnt'],
      abgelehnt: ['wartet'],
      deaktiviert: ['aktiv']
    };
    if (!erlaubt[status] || !erlaubt[status].includes(r.status)) {
      throw new ValidationError(`Statuswechsel von „${r.status}“ nach „${status}“ ist nicht möglich.`);
    }
    db.prepare('UPDATE lehrkraefte SET status = ?, entschieden_at = ?, session_gen = session_gen + 1 WHERE id = ?').run(status, iso(), id);
    return ansicht(row(id));
  }

  /** Einmal-Passwort setzen: wird genau einmal angezeigt, muss beim nächsten Login geändert werden. */
  async function einmalPasswort(id) {
    normalesKonto(id);
    const pw = S.einmalPasswort();
    const hash = await S.hashPasswort(pw);
    db.prepare('UPDATE lehrkraefte SET pw_hash = ?, muss_pw_aendern = 1, session_gen = session_gen + 1 WHERE id = ?').run(hash, id);
    return { passwort: pw, konto: ansicht(row(id)) };
  }

  function loeschen(id) {
    normalesKonto(id);
    db.prepare('DELETE FROM lehrkraefte WHERE id = ?').run(id);
  }

  return { sichereSuperadmin, registrieren, anmelden, ausSession, passwortAendern, liste, setzeStatus, einmalPasswort, loeschen, ansicht, row };
}

module.exports = { createKonten };
