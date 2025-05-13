import os

def delete_recursive(path):
    if os.stat(path)[0] & 0x4000:  # 是資料夾
        for entry in os.listdir(path):
            delete_recursive(path + "/" + entry)
        os.rmdir(path)
    else:
        os.remove(path)

for item in os.listdir("/"):
    delete_recursive("/" + item)

print("清空完成")
