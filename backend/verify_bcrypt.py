from app.utils.security import hash_password, verify_password

def test_bcrypt_fix():
    print("Testing Bcrypt compatibility fix...")
    
    # Test with a standard password
    short_pwd = "password123"
    short_hash = hash_password(short_pwd)
    assert verify_password(short_pwd, short_hash)
    print("✓ Short password hashed and verified.")

    # Test with a password longer than 72 characters
    long_pwd = "a" * 100
    try:
        long_hash = hash_password(long_pwd)
        assert verify_password(long_pwd, long_hash)
        print("✓ Long password (100 chars) hashed and verified without ValueError.")
    except ValueError as e:
        print(f"✗ Failed: Bcrypt still throwing ValueError: {e}")
    except Exception as e:
        print(f"✗ Unexpected error: {e}")

if __name__ == "__main__":
    test_bcrypt_fix()
