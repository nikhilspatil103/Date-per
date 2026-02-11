#!/bin/bash

files=(
  "app/(tabs)/chat.tsx"
  "app/(tabs)/find.tsx"
  "app/(tabs)/profile.tsx"
  "components/ChatScreen.tsx"
  "components/ContactsScreen.tsx"
  "components/NotificationCenter.tsx"
  "components/UserProfileDetailScreen.tsx"
  "services/location.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Check if import already exists
    if ! grep -q "import API_URL from" "$file"; then
      # Add import after the first import line
      sed -i '' "1a\\
import API_URL from '../config/api';\\
" "$file" 2>/dev/null || sed -i '' "1 i\\
import API_URL from '../config/api';\\
" "$file"
      echo "Added import to $file"
    fi
  fi
done
