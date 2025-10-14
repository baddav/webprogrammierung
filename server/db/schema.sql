CREATE TABLE IF NOT EXISTS pokemon (
                                       id INT PRIMARY KEY,
                                       name VARCHAR(100),
    sprite VARCHAR(255),
    height INT,
    weight INT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pokemon_stats (
                                             pokemon_id INT,
                                             hp INT,
                                             attack INT,
                                             defense INT,
                                             speed INT,
                                             PRIMARY KEY (pokemon_id),
    FOREIGN KEY (pokemon_id) REFERENCES pokemon(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pokemon_types (
                                             pokemon_id INT,
                                             type VARCHAR(50),
    KEY idx_pokemon_types_pid (pokemon_id),
    FOREIGN KEY (pokemon_id) REFERENCES pokemon(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS favorites (
                                         pokemon_id INT PRIMARY KEY,
                                         added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                         FOREIGN KEY (pokemon_id) REFERENCES pokemon(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS facts (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     text VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
