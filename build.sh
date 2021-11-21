# 打包文件
rm -rf ./dist dist.tar
tar -cvf dist.tar --exclude-from=./buildIgnore.txt ./
# 解压文件
mkdir dist
tar -xvf dist.tar -C ./dist