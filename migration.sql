DROP TABLE IF EXISTS play;
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS player;

CREATE TABLE player (
    id int NOT NULL AUTO_INCREMENT,
    first_name varchar(255) NOT NULL,
    last_name varchar(255),
    telegram_id varchar(255) NOT NULL,
    is_admin boolean DEFAULT false,
    PRIMARY KEY(id)
);


CREATE TABLE session (
    id int AUTO_INCREMENT,
    creater_id int NOT NULL,
    group_size int NOT NULL DEFAULT 20,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    FOREIGN KEY (creater_id) REFERENCES player(id)
);

CREATE TABLE play (
    id int AUTO_INCREMENT,
    player_id int NOT NULL,
    session_id int NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY (player_id) REFERENCES player(id),
    FOREIGN KEY (session_id) REFERENCES session(id)
);

INSERT INTO player (first_name, last_name, telegram_id, is_admin) VALUES ("Udayan", "Sahai", 5187734117, 1);