#!/bin/bash

# 发布脚本 - 自动切换到官方源并发布

echo "🚀 开始发布流程..."

# 保存当前源
CURRENT_REGISTRY=$(npm config get registry)
echo "📋 当前源: $CURRENT_REGISTRY"

# 切换到官方源
echo "🔄 切换到官方源..."
npm config set registry https://registry.npmjs.org/

# 检查登录状态
echo "🔐 检查登录状态..."
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ 未登录到 npm，请先登录:"
    npm login
fi

# 构建
echo "🔨 开始构建..."
npm run build

# 发布
echo "📦 开始发布..."
npm publish

# 恢复原来的源
echo "🔄 恢复到原来的源..."
npm config set registry $CURRENT_REGISTRY

echo "✅ 发布完成！"
echo "📋 已恢复到原来的源: $(npm config get registry)"
