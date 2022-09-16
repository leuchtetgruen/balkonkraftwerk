import json
import numpy as np
import os
from PyP100 import PyP110
from dotenv import load_dotenv

from http.server import BaseHTTPRequestHandler,HTTPServer

from datetime import datetime, timedelta

class TapoServer(BaseHTTPRequestHandler):


    def get_stats(self):
        data = solarPlug.getEnergyUsage()
        res = data['result']
        ret = {}
        ret['today']    = res['today_energy']
        ret['month']    = res['month_energy']
        ret['cur']      = int(res['current_power'] / 1000)
        ret['cur_max']  = int(os.getenv("MAX_WATTAGE") or 200)
        ret['cur_hr']   = int(res['past24h'][-1])

        hour_idx = datetime.now().hour
        hour_max = int(np.max([h[hour_idx] for h in res['past7d']]))


        print(res['past7d'])
        avg_hrs = []
        for hour in range(0, 24):
            avg_hr = int(np.mean([day[hour] for day in res['past7d']]))
            avg_hrs.append(avg_hr)

        ret['hours_avg'] = avg_hrs
        ret['hr_max']   = hour_max

        ret['30d_avg']  = int(np.mean(res['past30d']))
        ret['30d_max']  = int(np.max(res['past30d']))
        ret['mth_avg']  = int(np.mean(res['past1y']))
        ret['mth_max']  = int(np.max(res['past1y']))
        ret['30d'] = res['past30d']
        return ret

    def sanitized_path(self):
        path = self.path.removeprefix("/")
        path = path.replace("..", ".")

        return path

    #Handler for the GET requests
    def do_GET(self):
        self.send_response(200)
        if (self.path.endswith("html")):
            self.send_header('Content-type','text/html')
        elif (self.path.endswith("css")):
            self.send_header('Content-type','text/css')
        else:
            self.send_header('Content-type','text/html')
        self.end_headers()
        # Send the html message
        if (self.path == '/data.json'):
            self.wfile.write((json.dumps(self.get_stats())).encode())
        else:
            if self.path == "/":
                self.path = "/index.html"

            html = ''
            with open(self.sanitized_path()) as file:
                html = file.read()
            self.wfile.write((html).encode())


load_dotenv()
port = int(os.getenv("PORT") or "8089")
solarPlug = PyP110.P110(os.getenv("TAPO_IP_SOLAR"), os.getenv("TAPO_USERNAME"), os.getenv("TAPO_PASSWORD")) 
solarPlug.handshake()
solarPlug.login()
server = HTTPServer(('', port), TapoServer)
print('Started httpserver on port ', port)

#Wait forever for incoming http requests
server.serve_forever()
