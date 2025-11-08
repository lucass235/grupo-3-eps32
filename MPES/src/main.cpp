/**
 * Created by K. Suwatchai (Mobizt)
 *
 * Email: k_suwatchai@hotmail.com
 *
 * Github: https://github.com/mobizt/Firebase-ESP8266
 *
 * Copyright (c) 2023 mobizt
 *
 */

/** This example will show how to authenticate using
 * the legacy token or database secret with the new APIs (using config and auth data).
 */

#include <Arduino.h>
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <Adafruit_HTU21DF.h>

// Provide the RTDB payload printing info and other helper functions.
#include <addons/RTDBHelper.h>

/* 1. Define the WiFi credentials */
#define WIFI_SSID "uaifai-brum"
#define WIFI_PASSWORD "bemvindoaocesar"

/* 2. If work with RTDB, define the RTDB URL and database secret */
#define DATABASE_URL "https://grupo3-16a7b-default-rtdb.firebaseio.com/" //<databaseName>.firebaseio.com or <databaseName>.<region>.firebasedatabase.app
#define DATABASE_SECRET "UMSs7bB1EDf3EME51tolCDLnRFfSIKqNoobdwlyd"

/* 3. Define the Firebase Data object */
FirebaseData fbdo;

/* 4, Define the FirebaseAuth data for authentication data */
FirebaseAuth auth;

/* Define the FirebaseConfig data for config data */
FirebaseConfig config;
// Sensor HTU21D
Adafruit_HTU21DF htu = Adafruit_HTU21DF();

unsigned long dataMillis = 0;
int count = 0;
int  flag = 1;

void setup()
{

    if (!htu.begin()) {
        Serial.println("HTU21D nao encontrado!");
    } else {
        Serial.println("HTU21D inicializado");
    }
        
    pinMode(13, OUTPUT);
    pinMode(16, OUTPUT);
    pinMode(17, OUTPUT);
    pinMode(4, OUTPUT);
    pinMode(27, INPUT);

    Serial.begin(9600);
    Serial.println("hello world");

    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Connecting to Wi-Fi");
    while (WiFi.status() != WL_CONNECTED)
    {
        Serial.print(".");
        delay(300);
    }
    Serial.println();
    Serial.print("Connected with IP: ");
    Serial.println(WiFi.localIP());
    Serial.println();

    Serial.printf("Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);

    /* Assign the certificate file (optional) */
    // config.cert.file = "/cert.cer";
    // config.cert.file_storage = StorageType::FLASH;

    /* Assign the database URL and database secret(required) */
    config.database_url = DATABASE_URL;
    config.signer.tokens.legacy_token = DATABASE_SECRET;

    // Comment or pass false value when WiFi reconnection will control by your code or third party library e.g. WiFiManager
    Firebase.reconnectNetwork(true);

    // Since v4.4.x, BearSSL engine was used, the SSL buffer need to be set.
    // Large data transmission may require larger RX buffer, otherwise connection issue or data read time out can be occurred.
    fbdo.setBSSLBufferSize(4096 /* Rx buffer size in bytes from 512 - 16384 */, 1024 /* Tx buffer size in bytes from 512 - 16384 */);

    /* Initialize the library with the Firebase authen and config */
    Firebase.begin(&config, &auth);

    // Or use legacy authenticate method
    // Firebase.begin(DATABASE_URL, DATABASE_SECRET);
}

void loop()
{
    
    Serial.println(millis());
    
    if (millis() - dataMillis > 1000)
    {
        bool botao, led;
        float temperatura;
        float temp = htu.readTemperature();
        float hum = htu.readHumidity();
        int potenc, sound, potencia;

        potenc = analogRead(39);
        botao = digitalRead(27);
        sound = analogRead(36);

        Firebase.setBool(fbdo, "/botao", botao);
        if (botao == false){

          Firebase.setBool(fbdo, "/botao", botao);
          switch (flag)
          {
          case 1:
            digitalWrite(4, HIGH);
            Firebase.setBool(fbdo, "/flag", true);
            flag = 0;
            break;
          
          case 0:
            digitalWrite(4, LOW);
            Firebase.setBool(fbdo, "/flag", false);
            flag = 1;
            break;
          }
        }
        Firebase.getInt(fbdo, "/slider", &potencia);
        if (temp >= potencia){
          digitalWrite(13, HIGH);
          Firebase.setBool(fbdo, "/led", true);
        }
        else {
          digitalWrite(13, LOW);
          Firebase.setBool(fbdo, "/led", false);
        }
        if (sound < 1700){
          Firebase.setString(fbdo, "/sensor_sound", "baixo");
        }
        else if (sound < 2500){
          Firebase.setString(fbdo, "/sensor_sound", "medio");
        }
        else{
          Firebase.setString(fbdo, "/sensor_sound", "alto");
        }
        ;
        dataMillis = millis();
        //Serial.printf("Set int... %s\n", Firebase.setInt(fbdo, "/test/int", count++) ? "ok" : fbdo.errorReason().c_str());
        Firebase.setInt(fbdo, "/tempovida", millis()/1000);
        Firebase.getBool(fbdo, "/led", &led);
        Firebase.setFloat(fbdo, "/temperature", temp);
        Firebase.setFloat(fbdo, "/humidity", hum);
        Firebase.setInt(fbdo, "/slider", map(potenc, 0,4095, 0, 100));
        digitalWrite(13, led);
    }
}
