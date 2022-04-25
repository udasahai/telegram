DROP TABLE IF EXISTS Play;
DROP TABLE IF EXISTS Session;
DROP TABLE IF EXISTS Player;

CREATE TABLE Player (
    id int NOT NULL AUTO_INCREMENT,
    first_name varchar(255) NOT NULL,
    last_name varchar(255),
    telegram_id varchar(255) NOT NULL,
    is_admin boolean DEFAULT false,
    PRIMARY KEY(id)
);


CREATE TABLE Session (
    id int AUTO_INCREMENT,
    creater_id int NOT NULL,
    group_size int NOT NULL DEFAULT 20,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(id),
    FOREIGN KEY (creater_id) REFERENCES Player(id)
);

CREATE TABLE Play (
    id int AUTO_INCREMENT,
    player_id int NOT NULL,
    session_id int NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY (player_id) REFERENCES Player(id),
    FOREIGN KEY (session_id) REFERENCES Session(id)
);

INSERT INTO Player (first_name, last_name, telegram_id) VALUES ("Udayan", "Sahai", 5187734117)