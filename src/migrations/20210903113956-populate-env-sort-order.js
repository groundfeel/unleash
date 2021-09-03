exports.up = function (db, cb) {
    db.runSql(
        `SELECT *
                                   FROM environments`,
        (err, results) => {
            results.rows.forEach((env, index) => {
                db.runSql(
                    `INSERT INTO environments(sort_order) VALUES (${
                        index + 1
                    }) ON CONFLICT DO NOTHING;`,
                );
            });
            cb();
        },
    );
};

exports.down = function (db, cb) {
    db.runSql('DELETE FROM environments', cb);
};
