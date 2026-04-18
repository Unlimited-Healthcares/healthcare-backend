#!/usr/bin/env node

const { io } = require('socket.io-client');

console.log('🧪 Testing WebSocket connections...\n');

// Test Chat WebSocket
console.log('1. Testing Chat WebSocket (namespace: /chat)');
const chatSocket = io('https://api.unlimtedhealth.com/chat', { path: '/socket.io/' });

chatSocket.on('connect', () => {
  console.log('✅ Chat Socket.IO connected successfully');
  chatSocket.emit('authenticate', { userId: 'test-user', token: 'test-token' });
  setTimeout(() => chatSocket.close(), 2000);
});

chatSocket.on('connect_error', (err) => {
  console.error('❌ Chat connect_error:', err.message);
});

chatSocket.on('error', (err) => {
  console.error('❌ Chat error:', err);
});

// Test Notifications WebSocket
setTimeout(() => {
  console.log('\n2. Testing Notifications WebSocket (namespace: /notifications)');
  const notificationSocket = io('https://api.unlimtedhealth.com/notifications', { path: '/socket.io/' });

  notificationSocket.on('connect', () => {
    console.log('✅ Notifications Socket.IO connected successfully');
    notificationSocket.emit('authenticate', { userId: 'test-user', token: 'test-token' });
    setTimeout(() => notificationSocket.close(), 2000);
  });

  notificationSocket.on('connect_error', (err) => {
    console.error('❌ Notifications connect_error:', err.message);
  });

  notificationSocket.on('error', (err) => {
    console.error('❌ Notifications error:', err);
  });
}, 3000);

// Test Video Conference WebSocket
setTimeout(() => {
  console.log('\n3. Testing Video Conference WebSocket (namespace: /video-conference)');
  const videoSocket = io('https://api.unlimtedhealth.com/video-conference', { path: '/socket.io/' });

  videoSocket.on('connect', () => {
    console.log('✅ Video Conference Socket.IO connected successfully');
    videoSocket.emit('authenticate', { userId: 'test-user', token: 'test-token' });
    setTimeout(() => {
      videoSocket.close();
      console.log('\n🎉 All WebSocket tests completed!');
      process.exit(0);
    }, 2000);
  });

  videoSocket.on('connect_error', (err) => {
    console.error('❌ Video Conference connect_error:', err.message);
  });

  videoSocket.on('error', (err) => {
    console.error('❌ Video Conference error:', err);
  });
}, 6000);

// Timeout after 15 seconds
setTimeout(() => {
  console.log('\n⏰ Test timeout reached');
  process.exit(1);
}, 15000);
