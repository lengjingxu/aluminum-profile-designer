#!/usr/bin/env python3
"""
阿里云 FC 静态文件服务器
适配自定义域名路径前缀 /ai/aluminum-profile-designer
"""
import http.server
import socketserver
import os
import re

PORT = 9000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class FCStaticHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def translate_path(self, path):
        """处理 FC 自定义域名路径前缀 /ai/aluminum-profile-designer"""
        # 去除前缀
        prefix = '/ai/aluminum-profile-designer'
        if path.startswith(prefix):
            path = path[len(prefix):]
        if not path:
            path = '/'
        return super().translate_path(path)
    
    def end_headers(self):
        """添加 CORS 和缓存头"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'public, max-age=86400')
        super().end_headers()

if __name__ == '__main__':
    # 切换到 dist 目录（构建产物）
    os.chdir(os.path.join(DIRECTORY, 'dist'))
    with socketserver.TCPServer(("", PORT), FCStaticHandler) as httpd:
        print(f"Serving at port {PORT} from {os.getcwd()}")
        httpd.serve_forever()
