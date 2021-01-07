const express = require('express');
const SocketIO = require('socket.io');
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors from 'cors';
import routes from './server/backend/routes';
import GameServer from './server/game/core/GameServer';
const customParser = require('socket.io-msgpack-parser');

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

/*
app.get('/', function (req: any, res: { sendFile: (arg0: string) => void }) {
    res.sendFile(__dirname + '/client/public/index.html');
});

 */
//app.use('/client/public', express.static(__dirname + '/client/public'));

//Set all routes from routes folder
app.use('/', routes);

const server = serv.listen(2000, () => {
    console.log('listening on *:2000');
});

export const game = new GameServer(io);
