from twilio.rest import Client

account_sid = "AC2bb8f36375754babed6f4b3f344c8137"
auth_token = "36b3a424429e2623fdc77f39176d1395"

client = Client(account_sid, auth_token)

try:
    message = client.messages.create(
        body="Test message from Twilio",
        from_="+15055787629",  # your Twilio number
        to="+919789146620"     # replace with a VERIFIED number
    )
    print("✅ Message SID:", message.sid)
except Exception as e:
    print("❌ Error:", str(e))
