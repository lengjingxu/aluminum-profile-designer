#!/usr/bin/env python3
"""部署 aluminum-profile-designer 到阿里云 FC"""

import sys
sys.path.insert(0, "/root/.hermes/skills/openclaw-imports/deploy-fc")

from aliyun_fc_client import AliyunFCManager

def main():
    manager = AliyunFCManager()
    
    function_name = "aluminum-profile-designer"
    source_dir = "/tmp/aluminum-profile-designer-deploy"
    description = "铝型材结构设计工具 - 微信小程序 Web 版"
    
    # 环境变量（无特殊需求）
    env_vars = {}
    
    # Step 1: 检查函数是否存在
    print("=" * 60)
    print("Step 1: 检查函数...")
    existing_functions = manager.list_functions()
    func_exists = any(f["function_name"] == function_name for f in existing_functions)
    print(f"  函数 {function_name} 存在: {func_exists}")
    
    if func_exists:
        print("  → 更新代码...")
        result = manager.upload_function_code(function_name, source_dir)
        print(f"  代码更新结果: {result}")
        
        print("  → 更新配置...")
        result = manager.update_function_config(
            function_name=function_name,
            environment_variables=env_vars,
            description=description,
            memory_size=512,
            timeout=60,
        )
        print(f"  配置更新结果: {result}")
    else:
        print("  → 创建函数...")
        result = manager.create_function(
            function_name=function_name,
            source_dir=source_dir,
            description=description,
            start_command=["python3", "app.py"],
            port=9000,
            runtime="custom.debian10",
            memory_size=512,
            timeout=60,
            vpc_id=None,
            vswitch_ids=[],
            security_group_id=None,
            internet_access=True,
            environment_variables=env_vars,
        )
        print(f"  函数创建结果: {result}")
    
    # Step 2: HTTP 触发器
    print("=" * 60)
    print("Step 2: HTTP 触发器...")
    triggers = manager.list_triggers(function_name)
    if triggers:
        for t in triggers:
            print(f"  已有触发器 URL: {t.get('url_internet', 'N/A')}")
    else:
        trigger_result = manager.create_http_trigger(function_name)
        print(f"  创建触发器: {trigger_result}")
    
    # Step 3: 自定义域名路由
    print("=" * 60)
    print("Step 3: 自定义域名路由...")
    domains = manager.list_custom_domains()
    if domains:
        custom_domain = domains[0]["domain_name"]
        print(f"  使用域名: {custom_domain}")
        
        existing_routes = domains[0].get("routes", [])
        route_path = "/ai/aluminum-profile-designer/*"
        route_exists = any(r["path"] == route_path for r in existing_routes)
        
        if route_exists:
            print(f"  路由 {route_path} 已存在")
        else:
            print(f"  添加路由: {route_path} -> {function_name}")
            route_result = manager.add_domain_route(
                domain_name=custom_domain,
                path=route_path,
                function_name=function_name,
            )
            print(f"  路由添加结果: {route_result}")
    else:
        print("  ⚠️ 没有可用的自定义域名！")
    
    # Step 4: 汇总
    print("=" * 60)
    print("部署完成！")
    print(f"  访问地址: https://bitools.retailaim.cn/ai/aluminum-profile-designer/")
    print(f"  健康检查: https://bitools.retailaim.cn/ai/aluminum-profile-designer/")
    print("=" * 60)

if __name__ == "__main__":
    main()
