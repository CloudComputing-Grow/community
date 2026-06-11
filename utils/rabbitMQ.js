const amqp = require('amqplib');
const communityEventController = require('../controllers/communityEventController');

async function connectRabbitMQ() {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await conn.createChannel();

    // 회원탈퇴 이벤트 처리
    const userExchange = 'user.events';
    await channel.assertExchange(userExchange, 'topic', { durable: true });
    const userQ = await channel.assertQueue('community.user-delete.queue', { durable: true });
    await channel.bindQueue(userQ.queue, userExchange, 'user.deleted');

    channel.consume(userQ.queue, async (msg) => {
      if (msg !== null) {
        try {
          const eventData = JSON.parse(msg.content.toString());
          console.log('[community] 회원탈퇴 이벤트 수신:', eventData); // 추가
          if (eventData.eventType === 'UserDeleted') {
            await communityEventController.handleUserDeleted(eventData);
            console.log('[community] 회원탈퇴 데이터 삭제 완료 userId:', eventData.userId); // 추가
          }
          channel.ack(msg);
        } catch (error) {
          console.error('[community] 회원탈퇴 이벤트 처리 에러:', error);
          channel.nack(msg, false, true);
        }
      }
    });

    console.log('[community] 회원탈퇴 이벤트 구독 완료');

  } catch (err) {
    console.error('RabbitMQ 연결 에러:', err);
  }
}

connectRabbitMQ();

module.exports = { connectRabbitMQ };