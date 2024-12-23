const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'scrape-service',
  brokers: ['kafka:9092'],
  connectionTimeout: 10000, // 10 segundos
});

const producer = kafka.producer();

async function connectProducer() {
  try {
    await producer.connect();
    console.log("Producer connected to Kafka");
  } catch (error) {
    console.error("Failed to connect to Kafka. Retrying in 5 seconds...", error);
    setTimeout(connectProducer, 5000);
  }
}

connectProducer();

async function sendAlert(alertDetails) {
  try {
    await producer.send({
      topic: 'alerts',
      messages: [
        {
          key: alertDetails.orderId,
          value: JSON.stringify(alertDetails) // Enviar el objeto completo
        }
      ]
    });
    console.log(`Order status update sent for order ${alertDetails.orderId}: ${alertDetails.status}`);
  } catch (error) {
    console.error("Failed to send message to Kafka", error);
  }
}

