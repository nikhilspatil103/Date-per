# Ad Integration Guide for Spin Wheel

## Overview
This guide shows how to integrate rewarded video ads into the Spin Wheel feature using Google AdMob.

## Step 1: Install AdMob Package
```bash
npx expo install expo-ads-admob
```

## Step 2: Configure AdMob
Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-ads-admob",
        {
          "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
          "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
        }
      ]
    ]
  }
}
```

## Step 3: Update SpinWheelScreen.tsx

### Import AdMob
```typescript
import { AdMobRewarded } from 'expo-ads-admob';
```

### Add Ad Unit IDs (at top of file)
```typescript
const REWARDED_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
});

// For testing, use test IDs:
const TEST_AD_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/1712485313',
  android: 'ca-app-pub-3940256099942544/5224354917',
});
```

### Add Ad Loading Function
```typescript
const [adLoaded, setAdLoaded] = useState(false);

useEffect(() => {
  loadAd();
}, []);

const loadAd = async () => {
  try {
    await AdMobRewarded.setAdUnitID(TEST_AD_UNIT_ID); // Use REWARDED_AD_UNIT_ID in production
    await AdMobRewarded.requestAdAsync();
    await AdMobRewarded.showAdAsync();
    setAdLoaded(true);
  } catch (error) {
    console.log('Ad load error:', error);
    setAdLoaded(false);
  }
};
```

### Update handleSpin Function
Replace the TODO comment with:
```typescript
// Show rewarded ad
if (adLoaded) {
  try {
    await AdMobRewarded.showAdAsync();
    // Reload ad for next time
    loadAd();
  } catch (error) {
    console.log('Ad show error:', error);
  }
}
```

## Step 4: Alternative - React Native Google Mobile Ads

For better performance, use `@react-native-google-mobile-ads/admob`:

```bash
npm install @react-native-google-mobile-ads/admob
```

### Usage Example
```typescript
import { RewardedAd, RewardedAdEventType } from '@react-native-google-mobile-ads/admob';

const rewarded = RewardedAd.createForAdRequest('ca-app-pub-xxxxx');

const showRewardedAd = () => {
  return new Promise((resolve, reject) => {
    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        rewarded.show();
      }
    );

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        console.log('User earned reward:', reward);
        resolve(reward);
      }
    );

    rewarded.load();
  });
};

// In handleSpin:
await showRewardedAd();
```

## Step 5: Ad Placement Strategy

### Option 1: Before Reward (Current)
- Show ad after wheel stops spinning
- User watches ad to claim coins
- Better revenue, might frustrate users

### Option 2: After Reward
- User gets coins immediately
- Show ad as "bonus" for extra coins
- Better UX, lower revenue

### Option 3: Optional Ad for Bonus
- User can watch ad for 2x coins
- Completely optional
- Best UX, moderate revenue

## Step 6: Get AdMob Account
1. Go to https://admob.google.com
2. Create account
3. Add your app
4. Create "Rewarded" ad unit
5. Copy Ad Unit IDs
6. Replace test IDs with real IDs

## Step 7: Testing
- Always use test ad unit IDs during development
- Test on real devices (ads don't show in simulator)
- Verify ad loading and reward claiming

## Revenue Estimates (India)
- Rewarded Video CPM: ₹50-150 ($0.60-$1.80)
- Per 1000 spins: ₹50-150 revenue
- If 1000 daily active users spin: ₹50-150/day
- Monthly: ₹1,500-4,500 ($18-54)

## Best Practices
1. Always have fallback if ad fails to load
2. Don't force ads - give option to skip
3. Preload ads for better UX
4. Track ad performance in AdMob dashboard
5. A/B test ad placement strategies

## Implementation Priority
1. ✅ Spin wheel working (DONE)
2. ✅ Coin rewards working (DONE)
3. 🔄 Add AdMob package
4. 🔄 Implement rewarded ad
5. 🔄 Test with test IDs
6. 🔄 Submit to AdMob for approval
7. 🔄 Replace with real ad unit IDs
8. 🔄 Monitor performance

## Notes
- Ads require app to be published (at least in beta)
- AdMob approval takes 24-48 hours
- Start with test ads, switch to real after approval
- Consider showing ad only 50% of the time to balance UX and revenue
