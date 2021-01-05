import 'reflect-metadata'
import { createConnection } from 'typeorm'
import GameServer from '../game/core/GameServer'

export let game: GameServer

createConnection()
  .then(async (connection) => {
    /*
        const app = express();

        app.set('port', process.env.PORT || 2000);

        let serv = require('http').Server(app);
        let io: SocketIO.Server = SocketIO(serv, {});

        app.get(
            '/',
            function (req: any, res: { sendFile: (arg0: string) => void }) {
                res.sendFile(
                    '/Users/szafran/WebstormProjects/polania/public/index.html'
                );
            }
        );
        app.use(
            '/public',
            express.static(
                '/Users/szafran/WebstormProjects/polania' + '/public'
            )
        );

        // Call midlewares
        app.use(cors());
        app.use(helmet());
        app.use(bodyParser.json());

        //Set all routes from routes folder
        app.use('/', routes);

        app.listen(2000, () => {
            console.log('Server started on port 2000!');
        });

        game = new GameServer(io);

             */
  })
  .catch((error) => console.log(error))

/*
await connection.dropDatabase()

    let enemy = new EnemyExample()
    enemy.x = 256
    enemy.y = 256
    enemy.name = 'Lew'
    enemy.height = 64
    enemy.width = 64
    enemy.mapId = 15
    enemy.spawnTime = 5
    enemy.type = 'enemy'
    enemy.imageSrc = '../public/img/enemy.png'
    enemy.statistics = new EnemyStatistic()
    enemy.statistics.attack = [7, 10]
    enemy.statistics.armor = 12
    enemy.statistics.attackSpeed = 1
    enemy.statistics.criticalStrikeChance = 1.5
    enemy.statistics.criticalStrikePower = 1.2
    enemy.statistics.dexterity = 3
    enemy.statistics.strength = 8
    enemy.statistics.experience = 50
    enemy.statistics.intellect = 3
    enemy.statistics.level = 1

    return connection.manager
        .save(enemy)
 */
