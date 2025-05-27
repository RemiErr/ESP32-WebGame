import machine
import network
import socket
import os

from env import *

# WiFi 連線
ssid = SSID_NAME
password = PASSWORD

wifi = network.WLAN(network.STA_IF)
wifi.active(True)
wifi.connect(ssid, password)

while not wifi.isconnected():
    pass

print('WiFi連線成功, IP:', wifi.ifconfig()[0])


# MIME類型設定
def get_mime_type(filename):
    if filename.endswith('.html'):
        return 'text/html'
    if filename.endswith('.js'):
        return 'application/javascript'
    if filename.endswith('.png'):
        return 'image/png'
    if filename.endswith('.jpg') or filename.endswith('.jpeg'):
        return 'image/jpeg'
    if filename.endswith('.css'):
        return 'text/css'
    if filename.endswith('.ico'):
        return 'image/x-icon'
    if filename.endswith('.ogg'):
        return 'audio/ogg'
    return 'text/plain'


# 處理HTTP請求
def serve_file(client, path):
    try:
        if path == '/':
            path = '/index.html'

        full_path = '/game' + path

        with open(full_path[1:], 'rb') as f:
            client.send('HTTP/1.1 200 OK\r\n')
            client.send('Content-Type: {}\r\n'.format(get_mime_type(path)))
            client.send('Access-Control-Allow-Origin: *\r\n')
            client.send('Connection: close\r\n')
            client.send('\r\n')

            # 分段讀取與傳送
            while True:
                data = f.read(4096)  # 每次讀1024 bytes
                if not data:
                    break
                client.sendall(data)
    except Exception as e:
        print('Error serving file:', e)
        client.send('HTTP/1.1 404 Not Found\r\n')
        client.send('Content-Type: text/html\r\n')
        client.send('Access-Control-Allow-Origin: *\r\n')
        client.send('\r\n')
        client.send('<h1>404 Not Found</h1>')


# 外部按鈕事件
def btn_handler_w(pin):
    try:
        # 模擬按下鍵盤W鍵的請求
        client = socket.socket()
        client.connect(('0.0.0.0', 80))  # 連接到本地Web伺服器
        client.send(
            'GET /key-pressed/W HTTP/1.1\r\nHost: 0.0.0.0\r\n\r\n')
        client.close()
        print('Key W press request sent')
    except Exception as e:
        print('Error sending button request:', e)


def btn_handler_s(pin):
    try:
        # 模擬按下鍵盤W鍵的請求
        client = socket.socket()
        client.connect(('0.0.0.0', 80))  # 連接到本地Web伺服器
        client.send(
            'GET /key-pressed/S HTTP/1.1\r\nHost: 0.0.0.0\r\n\r\n')
        client.close()
        print('Key W press request sent')
    except Exception as e:
        print('Error sending button request:', e)


# 設定按鈕GPIO
btn_p1_up_pin = machine.Pin(0, machine.Pin.IN, machine.Pin.PULL_UP)
btn_p1_down_pin = machine.Pin(0, machine.Pin.IN, machine.Pin.PULL_UP)

# 設定按鈕中斷
btn_p1_up_pin.irq(trigger=machine.Pin.IRQ_FALLING, handler=btn_handler_w)
btn_p1_down_pin.irq(trigger=machine.Pin.IRQ_FALLING, handler=btn_handler_s)


# 啟動Server
addr = socket.getaddrinfo('0.0.0.0', 80)[0][-1]
server = socket.socket()
server.bind(addr)
server.listen(5)
print('Web Server已啟動')

while True:
    client, addr = server.accept()
    print('Client connected from', addr)
    try:
        request = client.recv(1024)
        request = str(request)
        path = request.split(' ')[1]
        print('Request for', path)
        serve_file(client, path)
    except Exception as e:
        print('Error:', e)
    finally:
        client.close()
