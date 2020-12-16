const express = require('express');
const SocketIO = require('socket.io');
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors from 'cors';
import routes from './server/backend/routes';
import GameServer from './server/game/core/GameServer';

const app = express();
app.set('port', process.env.PORT || 2000);

let serv = require('http').Server(app);
let io: SocketIO.Server = SocketIO(serv, {});

// Call midlewares
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());

app.use(
    cors({
        origin: ['http://localhost:2000/', 'http://localhost:8080/', 'http://159.65.115.115/', 'http://159.65.115.115:80/server', 'http://polania.me/', 'http://www.polania.me/'],
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
