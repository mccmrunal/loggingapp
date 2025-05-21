function getQI(ident, db) {
  // Remove any existing quotes to prevent double-quoting
  ident = ident.replace(/[`"]/g, '');
  
  if (db === 'mysql1' || db === 'mysql2' || db === 'mysql3') return `\`${ident}\``;
  if (db === 'hana' || db === 'pg') return `"${ident}"`;
  return ident;
}

function getQV(sValue, db) {
  if (db === 'mysql1' || db === 'mysql2' || db === 'mysql3') return `'${sValue}'`;
  if (db === 'hana' || db === 'pg') return `'${sValue}'`;
  return sValue;
}

function schema(db) {
  if (db === 'mysql1') return '`ELSA_QA`';
  if (db === 'mysql2') return '`armstrong`';
  if (db === 'mysql3') return '`ovh_mysql`';
  if (db === 'hana') return '"ELSA_DEMO"';
  if (db === 'pg') return '"elsa_qa"';
  return '';
}

module.exports = { getQI, getQV, schema }; 