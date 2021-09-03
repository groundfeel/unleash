exports.up = function (db, cb) {
    db.runSql(
        `SELECT *
                                   FROM environments`,
        (err, results) => {
            results.rows.forEach((environment, index) => {
                db.runSql(
                    `INSERT INTO environments (sort_order) VALUES (${
                        index + 1
                    }) WHERE name = '${environment.name}';`,
                );
            });
            cb();
        },
    );
};

exports.down = function (db, cb) {
    db.runSql('DELETE FROM environments', cb);
};
