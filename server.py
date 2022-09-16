import json
import numpy as np
import os
from PyP100 import PyP110
from dotenv import load_dotenv

from http.server import BaseHTTPRequestHandler,HTTPServer

from datetime import datetime, timedelta
from meteostat import Daily


class TapoServer(BaseHTTPRequestHandler):

    def get_30d_sun(self):
        start = datetime.now() - timedelta(days=30)
        end = datetime.now()

        data = Daily(os.getenv("METEOSTAT_STATION_ID"), start, end)
        data = data.fetch()
        vals = list(data['tsun'])
        suns = []
        for v in vals:
            if np.isnan(v):
                suns.append(0)
            else:
                suns.append(v / 6)

        suns.pop()
        return suns

    def get_stats(self):
        data = p110.getEnergyUsage()
        res = data['result']
        ret = {}
        ret['today']    = res['today_energy']
        ret['month']    = res['month_energy']
        ret['cur']      = int(res['current_power'] / 1000)
        ret['cur_max']  = int(os.getenv("MAX_WATTAGE") or 200)
        ret['cur_hr']   = int(res['past24h'][-1])

        hour_idx = datetime.now().hour
        hour_max = int(np.max([h[hour_idx] for h in res['past7d']]))
        ret['hr_max']   = hour_max

        ret['30d_avg']  = int(np.mean(res['past30d']))
        ret['30d_max']  = int(np.max(res['past30d']))
        ret['mth_avg']  = int(np.mean(res['past1y']))
        ret['mth_max']  = int(np.max(res['past1y']))
        ret['30d'] = res['past30d']
        ret['sun'] = self.get_30d_sun()
        # return data['result']
        return ret

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
            with open(self.path.replace("/", "")) as file:
                html = file.read()
            self.wfile.write((html).encode())


load_dotenv()
port = int(os.getenv("PORT") or "8089")
p110 = PyP110.P110(os.getenv("TAPO_IP"), os.getenv("TAPO_USERNAME"), os.getenv("TAPO_PASSWORD")) 
p110.handshake()
p110.login()
server = HTTPServer(('', port), TapoServer)
print('Started httpserver on port ', port)

#Wait forever for incoming http requests
server.serve_forever()
