from flask import Flask, request, Response
import requests

app = Flask(__name__)

# add CORS header to every response
@app.after_request
def add_cors(resp):
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return resp

# generic proxy route: forward anything after /wb/
@app.route('/wb/<path:rest>', methods=['GET', 'OPTIONS'])
def wb(rest):
    # rebuild World Bank URL and forward all query parameters
    target = f"https://api.worldbank.org/v2/{rest}"
    # include original query params (format, per_page, date, etc.)
    r = requests.get(target, params=request.args, timeout=10)
    return Response(r.content, status=r.status_code, content_type=r.headers.get('Content-Type'))

if __name__ == '__main__':
    print("Starting local WB proxy on port 5001. Use Ctrl-C to stop.")
    app.run(host='127.0.0.1', port=5001)
