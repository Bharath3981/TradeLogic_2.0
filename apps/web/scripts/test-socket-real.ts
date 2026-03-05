import { io } from 'socket.io-client';
// import jwt from 'jsonwebtoken';
// import { config } from '../src/config/config'; // Requires ts-node to run with imports

// 1. Generate a valid JWT for testing (Simulating App Login)
// You must provide a valid USER ID from your database that has a Kite Token!
const TEST_USER_ID = '9179ca52-6387-43c5-b6bf-245e39f9c090'; // eslint-disable-line @typescript-eslint/no-unused-vars
// const token = jwt.sign({ id: TEST_USER_ID, email: 'bharath.baisetty@gmail.com' }, config.JWT_SECRET, { expiresIn: '1h' });
const token = "YOUR_TEST_TOKEN_HERE"; 

console.log('--- Testing Real WebSocket ---');
console.log('Generated Test JWT:', token);

// 2. Connect to Socket Server
const socket = io('http://localhost:9000', {
    auth: { token }, // Pass JWT
    transports: ['websocket']
});

socket.on('connect', () => {
    console.log('✅ Connected to WebSocket Server');
    
    // 3. Subscribe to an Instrument (e.g., NIFTY 50 - 256265)
    // Make sure this is a valid token!
    const INSTRUMENT_TOKEN = 256265; 
    console.log(`Subscribing to ${INSTRUMENT_TOKEN}...`);
    socket.emit('subscribe', [INSTRUMENT_TOKEN]);
});

socket.on('tick', (tick) => {
    console.log('📉 Tick Received:', tick);
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected');
});

socket.on('connect_error', (err) => {
    console.error('❌ Connection Error:', err.message);
});
