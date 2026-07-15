import requests

url = "https://formsubmit.co/ajax/teamwebbranding@gmail.com"
payload = {
    "name": "Test User",
    "email": "test@example.com",
    "message": "This is a test message from python script.",
    "_subject": "Test Submission"
}

headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

print(f"Submitting to {url}...")
try:
    response = requests.post(url, json=payload, headers=headers, allow_redirects=True)
    print("Status Code:", response.status_code)
    print("Response JSON:")
    try:
        print(response.json())
    except:
        print(response.text)
except Exception as e:
    print("Error:", e)
