import os
import re

def collect_code_from_core(root_dir, output_file):
    """
    Recursively collects all Python code from the core directory and writes it to a single file
    with structure information in the header.
    
    Args:
        root_dir: Path to the core directory
        output_file: Path to the output file
    """
    # Dictionary to hold the file paths and their content
    files_dict = {}
    
    # Walk through the directory
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            # Only process Python files
            if filename.endswith('.py'):
                full_path = os.path.join(dirpath, filename)
                
                # Create a relative path from root_dir
                rel_path = os.path.relpath(full_path, start=os.path.dirname(root_dir))
                
                # Skip pycache files
                if '__pycache__' in rel_path:
                    continue
                
                try:
                    # Read the file content
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Store the file path and content
                    files_dict[rel_path] = content
                except Exception as e:
                    print(f"Error reading {full_path}: {e}")
    
    # Sort the files by path for a more organized output
    sorted_files = sorted(files_dict.keys())
    
    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as out:
        # Write header with directory structure
        out.write("# Core Directory Structure\n\n")
        
        # First, extract just the directory structure
        dirs = set()
        for file_path in sorted_files:
            dir_path = os.path.dirname(file_path)
            if dir_path:
                dirs.add(dir_path)
        
        # Sort and write dirs
        sorted_dirs = sorted(dirs)
        for dir_path in sorted_dirs:
            out.write(f"# {dir_path}/\n")
        
        out.write("\n\n# ======================================\n")
        out.write("# FILE CONTENTS\n")
        out.write("# ======================================\n\n")
        
        # Now write each file's content
        for file_path in sorted_files:
            out.write(f"# {file_path} {'=' * (80 - len(file_path))}\n\n")
            out.write(f"{file_path}:\n```python\n{files_dict[file_path]}\n```\n\n")
            out.write("#" + "-" * 100 + "\n\n")

if __name__ == "__main__":
    # Change these paths to match your environment
    core_directory = r"c:\Users\abdoa\Downloads\apqp\core"
    output_file = r"c:\Users\abdoa\Downloads\apqp\core_consolidated.txt"
    
    collect_code_from_core(core_directory, output_file)
    print(f"Code has been consolidated to {output_file}")