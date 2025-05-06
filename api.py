import re
import os
import json

def extract_endpoints_from_html(html_content):
    """Extract API endpoints and their details from the API testing HTML file"""
    
    # Pattern to match endpoint definitions
    endpoint_pattern = r'onclick="loadEndpoint\(\'(GET|POST|PUT|DELETE|PATCH)\', \'([^\']+)\'(?:, (.+?))?\)">(.*?)</li>'
    
    # Find all endpoint definitions
    endpoints = re.findall(endpoint_pattern, html_content, re.DOTALL)
    
    # Group endpoints by category based on tab structure
    category_pattern = r'<div id="([^"]+)-tab" class="tab-content">'
    categories = re.findall(category_pattern, html_content)
    
    current_category = None
    categorized_endpoints = {}
    
    for match in re.finditer(category_pattern, html_content):
        category_id = match.group(1)
        start_pos = match.end()
        
        # Find the end of this category section (next category or end of file)
        next_match = re.search(category_pattern, html_content[start_pos:])
        if next_match:
            end_pos = start_pos + next_match.start()
        else:
            end_pos = len(html_content)
        
        # Extract endpoints in this section
        section_content = html_content[start_pos:end_pos]
        section_endpoints = re.findall(endpoint_pattern, section_content, re.DOTALL)
        
        # Format endpoint information and store by category
        formatted_endpoints = []
        for method, url, body, description in section_endpoints:
            # Clean up description
            description = description.strip()
            description = re.sub(r'^.+? - ', '', description)  # Remove the URL part
            
            # Parse JSON body if present
            json_body = None
            if body:
                try:
                    # Handle JavaScript object literals 
                    # Replace single quotes with double quotes for proper JSON parsing
                    body = body.replace("'", '"')
                    # Fix JavaScript's unquoted property names
                    body = re.sub(r'([{,])\s*(\w+):', r'\1"\2":', body)
                    json_body = json.loads(body)
                except json.JSONDecodeError:
                    json_body = f"Error parsing: {body}"
            
            formatted_endpoints.append({
                "method": method,
                "url": url,
                "description": description,
                "body": json_body
            })
        
        # Add to categorized dictionary
        category_name = category_id.replace("-tab", "").capitalize()
        categorized_endpoints[category_name] = formatted_endpoints
    
    return categorized_endpoints

def generate_api_documentation(endpoints):
    """Generate API documentation text from endpoints data"""
    
    doc = []
    doc.append("=" * 80)
    doc.append("APQP/PPAP Manager API Documentation".center(80))
    doc.append("=" * 80)
    doc.append("\nThis document provides a comprehensive reference to the APQP/PPAP Manager API endpoints.\n")
    
    # Add table of contents
    doc.append("TABLE OF CONTENTS")
    doc.append("----------------\n")
    for i, category in enumerate(endpoints.keys(), 1):
        doc.append(f"{i}. {category}")
    doc.append("\n")
    
    # Add detailed endpoint documentation
    for category, endpoints_list in endpoints.items():
        doc.append("=" * 80)
        doc.append(f"{category} API".center(80))
        doc.append("=" * 80)
        doc.append("")
        
        for endpoint in endpoints_list:
            doc.append("-" * 80)
            doc.append(f"Endpoint: {endpoint['url']}")
            doc.append(f"Method: {endpoint['method']}")
            doc.append(f"Description: {endpoint['description']}")
            
            if endpoint['body']:
                doc.append("\nRequest Body:")
                try:
                    # Format JSON body with indentation
                    formatted_json = json.dumps(endpoint['body'], indent=2)
                    doc.append("```json")
                    doc.append(formatted_json)
                    doc.append("```")
                except:
                    doc.append(str(endpoint['body']))
            
            doc.append("\n")
    
    return "\n".join(doc)

def main():
    """Main function to read HTML and generate API documentation"""
    try:
        # Read the API testing HTML file
        html_path = r"c:\Users\abdoa\Downloads\apqp\frontend\templates\api_testing.html"
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Extract endpoints
        endpoints = extract_endpoints_from_html(html_content)
        
        # Generate API documentation
        documentation = generate_api_documentation(endpoints)
        
        # Include API client methods from api.js
        api_js_path = r"c:\Users\abdoa\Downloads\apqp\frontend\static\js\api.js"
        if os.path.exists(api_js_path):
            with open(api_js_path, 'r', encoding='utf-8') as f:
                api_js_content = f.read()
            
            # Extract client methods
            method_pattern = r'async\s+(\w+)\([^)]*\)\s*{'
            client_methods = re.findall(method_pattern, api_js_content)
            
            # Add client methods to documentation
            documentation += "\n" + "=" * 80 + "\n"
            documentation += "API CLIENT METHODS".center(80) + "\n"
            documentation += "=" * 80 + "\n\n"
            documentation += "The following methods are available in the JavaScript API client:\n\n"
            
            for method in client_methods:
                documentation += f"- {method}()\n"
        
        # Write documentation to file
        output_path = r"c:\Users\abdoa\Downloads\apqp\api.txt"
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(documentation)
        
        print(f"API documentation generated and saved to {output_path}")
        
    except Exception as e:
        print(f"Error generating API documentation: {str(e)}")

if __name__ == "__main__":
    main()