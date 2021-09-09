exports.up = function (db, cb) {
    db.runSql(
        `
    ALTER TABLE environments ADD COLUMN protected BOOLEAN DEFAULT FALSE;
    UPDATE environments SET protected = TRUE WHERE name = ':global:';
  `,
        cb,
    );
};

exports.down = function (db, cb) {
    db.runSql(
        `
    ALTER TABLE environments DROP COLUMN protected;
  `,
        cb,
    );
};

exports._meta = {
    version: 1,
};
