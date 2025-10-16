#!/bin/bash

# 代理池功能测试脚本

echo "🚀 开始测试代理池功能..."

# 检测实际运行的端口
echo "🔍 检测服务端口..."
PORT=$(curl -s "http://localhost:3334/api" 2>/dev/null | head -1 | grep -o '[0-9]*' || echo "3334")
echo "检测到端口: $PORT"

echo -e "\n"

# 1. 测试代理池健康状态
echo "📊 测试代理池健康状态..."
curl -X GET "http://localhost:$PORT/proxy-pool/health" \
  -H "Content-Type: application/json" \
  -w "HTTP状态: %{http_code}\n"

echo -e "\n"

# 2. 测试获取代理池统计信息
echo "📈️ 测试代理池统计信息..."
curl -X GET "http://localhost:$PORT/proxy-pool/stats" \
  -H "Content-Type: application/json" \
  -w "HTTP状态: %{http_code}\n"

echo -e "\n"

# 3. 测试刷新代理池
echo "🔄 测试刷新代理池..."
curl -X POST "http://localhost:$PORT/proxy-pool/refresh" \
  -H "Content-Type: application/json" \
  -w "HTTP状态: %{http_code}\n"

echo -e "\n"

# 4. 测试代理提供商列表
echo "📋 测试代理提供商列表..."
curl -X GET "http://localhost:$PORT/proxy-pool/providers" \
  -H "Content-Type: application/json" \
  -w "HTTP状态: %{http_code}\n"

echo -e "\n"

# 5. 测试获取代理列表
echo "📝 测试代理列表..."
curl -X GET "http://localhost:$PORT/proxy-pool/proxies" \
  -H "Content-Type: application/json" \
  -w "HTTP状态: %{http_code}\n"

echo -e "\n"

# 6. 测试代理池配置
echo "⚙️ 测试代理池配置..."
curl -X GET "http://localhost:$PORT/proxy-pool/config" \
  -H "Content-Type: application/json" \
  -w "HTTP状态: %{http_code}\n"

echo -e "\n"

# 7. 测试性能报告
echo "📈️ 测试性能报告..."
curl -X GET "http://localhost:$PORT/proxy-pool/performance" \
  -H "Content-Type: application/json" \
  -w "HTTP状态: %{http_code}\n"

echo -e "\n"

# 8. 测试代理测试功能
echo "🧪 测试代理测试功能..."
curl -X POST "http://localhost:$PORT/proxy-pool/test" \
  -H "Content-Type: application/json" \
  -d '{"host": "8.8.8.8", "port": 8080, "protocol": "http"}' \
  -w "HTTP状态: %{http_code}\n"

echo -e "\n"

echo "✅ 代理池功能测试完成！"