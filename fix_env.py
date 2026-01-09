
import os

def fix_env():
    path = '.env'
    if not os.path.exists(path):
        print(".env not found")
        return

    with open(path, 'r') as f:
        content = f.read()

    print(f"Original length: {len(content)}")
    
    # Check if the key exists but is not on a new line (e.g. mashed against previous value)
    key = "GOOGLE_POLLEN_API_KEY"
    if key in content:
        # If it doesn't start with newline and isn't at start of file
        index = content.find(key)
        if index > 0 and content[index-1] != '\n':
            print("Found malformed .env (missing newline). Fixing...")
            # Insert newline
            content = content[:index] + '\n' + content[index:]
            
            with open(path, 'w') as f:
                f.write(content)
            print("Fixed .env formatting.")
        else:
            print(".env looks okay regarding newline before key.")
    else:
        print("Key not found in .env? appending it.")
        with open(path, 'a') as f:
            f.write(f"\n{key}=AIzaSyCFX3BSNZAi5boIAKs6sCJdtsvVeKZFapc")
        print("Appended key.")

if __name__ == "__main__":
    fix_env()
