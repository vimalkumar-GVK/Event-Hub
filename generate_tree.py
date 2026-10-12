import os

def generate_tree(startpath, exclude_dirs):
    tree_str = ""
    for root, dirs, files in os.walk(startpath):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        level = root.replace(startpath, '').count(os.sep)
        indent = '│   ' * (level)
        tree_str += f'{indent}├── {os.path.basename(root)}/\n'
        subindent = '│   ' * (level + 1)
        for f in files:
            tree_str += f'{subindent}├── {f}\n'
    return tree_str

path = r"d:\deployed projects\Event Hub\Event-Hub"
exclude = ["node_modules", "venv", "__pycache__", ".git", ".github", ".coverage"]
with open("tree.txt", "w", encoding="utf-8") as f:
    f.write(generate_tree(path, exclude))
