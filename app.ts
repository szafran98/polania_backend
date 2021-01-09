import { IPlayer } from './Interfaces';

const express = require('express');
const SocketIO = require('socket.io');
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors from 'cors';
import routes from './server/backend/routes';
import GameServer from './server/game/core/GameServer';
const customParser = require('socket.io-msgpack-parser');
const cluster = require('cluster');
const htpp = require('http');

let game: GameServer;
let bgCluster;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    bgCluster = cluster.fork();

    const app = express();
    app.set('port', process.env.PORT || 2000);

    let serv = require('http').Server(app);
    let io: SocketIO.Server = SocketIO(serv, {});

    // Call midlewares
    app.use(cors());
    app.use(helmet());
    app.use(bodyParser.json());

    app.use(function (req, res, next) {
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');

        // Request methods you wish to allow
        res.setHeader(
            'Access-Control-Allow-Methods',
            'GET, POST, OPTIONS, PUT, PATCH, DELETE'
        );

        // Request headers you wish to allow
        res.setHeader(
            'Access-Control-Allow-Headers',
            'X-Requested-With,content-type'
        );

        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', true);

        // Pass to next layer of middleware
        next();
    });

    app.use(
        cors({
            origin: [
                'http://localhost:2000/',
                'http://localhost:8080/',
                'http://159.65.115.115/',
                'http://159.65.115.115:80/server',
                'http://localhost:2000/',
                'http://www.localhost:2000/',
            ],
        })
    );
    app.options('*', cors());
    cors({ credentials: true, origin: true });

    //Set all routes from routes folder
    app.use('/', routes);

    const server = serv.listen(2000, () => {
        console.log('listening on *:2000');
    });
    game = new GameServer(io);
} else {
    console.log(`Worker ${process.pid} started`);

    process.on('message', (playerData: any) => {
        processPlayerMove(playerData);
    });

    function processPlayerMove(playerData: IPlayer) {
        //console.log(playerData);
        let startPos = {
            x: playerData.x,
            y: playerData.y,
        };
        const moveInterval = setInterval(() => {
            playerData.hasMoved = true;
            if (playerData.currentDirection === 2) {
                playerData.x += playerData.maxSpeed;
            } else if (playerData.currentDirection === 1) {
                playerData.x -= playerData.maxSpeed;
            } else if (playerData.currentDirection === 3) {
                playerData.y -= playerData.maxSpeed;
            } else if (playerData.currentDirection === 0) {
                playerData.y += playerData.maxSpeed;
            }

            // CHARACTER ANIMATION COUNTER
            if (playerData.frameCount >= 64) {
                playerData.frameCount = 0;
                playerData.currentLoopIndex += 1;
            }

            if (playerData.currentLoopIndex >= 4) {
                playerData.currentLoopIndex = 0;
            }

            /*
            if (
                playerData.currentDirection === 1 ||
                playerData.currentDirection === 2
            ) {
                if (Math.abs(startPos.x - playerData.x) <= 8) {
                    playerData.currentLoopIndex = 0;
                } else if (Math.abs(startPos.x - playerData.x) <= 16) {
                    playerData.currentLoopIndex = 1;
                } else if (Math.abs(startPos.x - playerData.x) <= 24) {
                    playerData.currentLoopIndex = 2;
                } else if (Math.abs(startPos.x - playerData.x) <= 32) {
                    playerData.currentLoopIndex = 3;
                }
            }
            if (
                playerData.currentDirection === 3 ||
                playerData.currentDirection === 0
            ) {
                if (Math.abs(startPos.y - playerData.y) <= 8) {
                    playerData.currentLoopIndex = 0;
                } else if (Math.abs(startPos.y - playerData.y) <= 16) {
                    playerData.currentLoopIndex = 1;
                } else if (Math.abs(startPos.y - playerData.y) <= 24) {
                    playerData.currentLoopIndex = 2;
                } else if (Math.abs(startPos.y - playerData.y) <= 32) {
                    playerData.currentLoopIndex = 3;
                }
            }

             */

            //console.log(playerData.y);
            //console.log(playerData.currentLoopIndex);

            process.send({
                x: playerData.x,
                y: playerData.y,
                frameCount: playerData.frameCount,
                currentLoopIndex: playerData.currentLoopIndex,
                hasMoved: playerData.hasMoved,
            });

            playerData.frameCount += 16;
            // move += 4;
            if (playerData.x % 32 === 0 && playerData.y % 32 === 0) {
                //console.log('move = 32');
                clearInterval(moveInterval);
                playerData.currentLoopIndex = 0;
                playerData.frameCount = 0;
                playerData.hasMoved = false;

                process.send({
                    x: playerData.x,
                    y: playerData.y,
                    frameCount: playerData.frameCount,
                    currentLoopIndex: playerData.currentLoopIndex,
                    hasMoved: playerData.hasMoved,
                });
            }
        }, 1000 / 100);
    }
}

export { game, bgCluster };

/*
const app = express();
app.set('port', process.env.PORT || 2000);

let serv = require('http').Server(app);
let io: SocketIO.Server = SocketIO(serv, {});

// Call midlewares
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');

    // Request methods you wish to allow
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS, PUT, PATCH, DELETE'
    );

    // Request headers you wish to allow
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-Requested-With,content-type'
    );

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(
    cors({
        origin: [
            'http://localhost:2000/',
            'http://localhost:8080/',
            'http://159.65.115.115/',
            'http://159.65.115.115:80/server',
            'http://localhost:2000/',
            'http://www.localhost:2000/',
        ],
    })
);
app.options('*', cors());
cors({ credentials: true, origin: true });


//Set all routes from routes folder
app.use('/', routes);

const server = serv.listen(2000, () => {
    console.log('listening on *:2000');
});

export const game = new GameServer(io);
*/
