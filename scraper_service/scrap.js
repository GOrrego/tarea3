const puppeteer = require('puppeteer');
const kafka = require('kafkajs').Kafka;




(async () => {
    const kafkaClient = new kafka({ clientId: 'scrape-service', brokers: ['kafka:9092'] });
    const producer = kafkaClient.producer();
/*    async function createTopic() {

        const admin = kafka.admin();
        await admin.connect();
        
        const topicName = 'alerts';
        
        try {
            const topics = await admin.listTopics();
        
            if (topics.includes(topicName)) {
            console.log(`Tópico '${topicName}' ya existe.`);
            } else {
            await admin.createTopics({
                topics: [{ topic: topicName, numPartitions: 1, replicationFactor: 1 }]
            });
            console.log(`Tópico '${topicName}' creado.`);
            }
        } catch (err) {
            console.error(`Error al crear el tópico: ${err.message}`);
        } finally {
            await admin.disconnect();
        }
        }
        createTopic();*/
    try {
        await producer.connect();
        console.log('Conectado a Kafka como productor.');


        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          });
          
        const page = await browser.newPage();

        // Configura el viewport
        await page.setViewport({ width: 1280, height: 800 });

        // Función para publicar mensajes en Kafka
        const publishToKafka = async (message) => {
            try {
                await producer.send({
                    topic: 'alerts',
                    messages: [{ value: JSON.stringify(message) }]
                });
                console.log(`Alerta publicada en Kafka: ${JSON.stringify(message)}`);
            } catch (err) {
                console.error(`Error al publicar en Kafka: ${err.message}`);
            }
        };

        // Escucha las respuestas de red
        page.on('response', async (response) => {
            try {
                if (response.request().method() === 'GET' && response.url().includes('georss')) {
                    console.log(`Solicitud capturada: ${response.url}`);

                    try {
                        const jsonResponse = await response.json();

                        if (jsonResponse.alerts && Array.isArray(jsonResponse.alerts)) {
                            for (const alert of jsonResponse.alerts) {
                                const alertMessage = {
                                    id: alert.id || 'Desconocido',
                                    city: alert.city || 'Desconocido',
                                    street: alert.street || 'Desconocido',
                                    type: alert.type || 'Desconocido',
                                    reliability: alert.reliability || 'Desconocido'
                                };

                                await publishToKafka(alertMessage);
                            }
                        } else {
                            console.log('No se encontraron alertas en esta respuesta.');
                        }
                    } catch (jsonError) {
                        console.error(`Error al parsear JSON de la respuesta: ${jsonError}`);
                    }
                }
            } catch (error) {
                console.error(`Error al procesar la respuesta: ${error}`);
            }
        });

        await page.goto('https://www.waze.com', { waitUntil: 'networkidle2' });

        const originSelector = '#map > div.wm-cards.is-destination > div.wm-card.is-routing > div > div.wz-search-from-to > div.wz-search-container.is-origin > div > div > input';

        async function buscar(selector, texto) {
            try {
                console.log(`Esperando el selector: ${selector}`);
                await page.waitForSelector(selector);

                const textField = await page.$(selector);
                if (!textField) {
                    throw new Error(`No se encontró el elemento con el selector: ${selector}`);
                }

                console.log(`Interactuando con el campo de texto.`);
                await textField.click({ clickCount: 3 }); // Seleccionar todo el texto existente
                await textField.type(texto, { delay: 100 }); // Introducir texto con un pequeño retardo
                await textField.press('Enter');

                console.log(`Esperando a que la navegación termine después de ingresar: ${texto}`);
                await page.waitForFunction(() => document.readyState === 'complete'); // Verifica que el DOM esté completamente cargado
            } catch (error) {
                console.error(`Error en la función buscar para '${texto}': ${error.message}`);
            }
        }

        await buscar(originSelector, 'Santiago');

        console.log('Procesamiento finalizado. Cerrando el navegador...');

        await browser.close();
    } catch (err) {
        console.error(`Error en el productor de Kafka o Puppeteer: ${err.message}`);
    } finally {
        await producer.disconnect();
        console.log('Desconectado de Kafka.');
    }
})();
