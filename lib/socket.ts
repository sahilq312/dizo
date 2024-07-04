import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = /* process.env.NODEEN_V === 'production' ? undefined : */ 'http://localhost:4000';

export const socket = io(URL);