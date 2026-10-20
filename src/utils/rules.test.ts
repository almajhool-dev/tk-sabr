import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanTikTokUsername, isValidTikTokUsername, calculateEngagementRate } from './tiktok.ts';
import { calculateSecurityScore } from './securityScore.ts';
import { diagnoseProfileProblems } from './diagnostics.ts';
import { calculateOrderPrice } from './paymentAdapter.ts';
import type { TikTokProfile } from '../types/index.ts';

test('cleanTikTokUsername sanitizes inputs correctly', () => {
  assert.equal(cleanTikTokUsername('@khaby.lame'), 'khaby.lame');
  assert.equal(cleanTikTokUsername('mrbeast'), 'mrbeast');
  assert.equal(
    cleanTikTokUsername('https://www.tiktok.com/@noorstars?lang=ar'),
    'noorstars'
  );
  assert.equal(
    cleanTikTokUsername('tiktok.com/@charlidamelio/video/123456789'),
    'charlidamelio'
  );
  assert.equal(cleanTikTokUsername('  @bellapoarch  '), 'bellapoarch');
});

test('isValidTikTokUsername validates length and characters', () => {
  assert.equal(isValidTikTokUsername('mrbeast'), true);
  assert.equal(isValidTikTokUsername('a'), false); // too short
  assert.equal(isValidTikTokUsername('valid_user.123'), true);
  assert.equal(isValidTikTokUsername('invalid user with spaces'), false);
  assert.equal(isValidTikTokUsername('invalid@user#'), false);
});

test('calculateEngagementRate computes correct ratios', () => {
  // 10,000 followers, 100,000 likes, 10 videos -> avg 10,000 likes/video -> 100%
  const rate1 = calculateEngagementRate(10000, 100000, 10);
  assert.equal(rate1, 100);

  // 100,000 followers, 50,000 likes, 50 videos -> avg 1,000 likes/video -> 1%
  const rate2 = calculateEngagementRate(100000, 50000, 50);
  assert.equal(rate2, 1);
});

test('calculateSecurityScore outputs valid range and specified colors', () => {
  // Test complete high profile
  const completeProfile: Partial<TikTokProfile> = {
    username: 'verified_creator',
    displayName: 'Creator Star',
    avatar: 'https://p16-sign.tiktokcdn.com/avatar.jpg',
    bio: 'Official TikTok creator account posting tech tutorials daily!',
    verified: true,
    followersCount: 500000,
    followingCount: 150,
    likesCount: 5000000,
    videoCount: 120,
    engagementRate: 5.2,
    dataReliability: 'verified_public',
  };

  const highResult = calculateSecurityScore(completeProfile);
  assert.ok(highResult.score >= 80, `Expected score >= 80, got ${highResult.score}`);
  assert.ok(
    highResult.color === '#10b981' || highResult.color === '#eab308',
    'High score should be green or yellow'
  );
  assert.equal(highResult.factors.length, 5);

  // Test empty profile
  const emptyProfile: Partial<TikTokProfile> = {
    username: 'empty_user',
    displayName: '',
    avatar: '',
    bio: '',
    verified: false,
    followersCount: 0,
    followingCount: 500,
    likesCount: 0,
    videoCount: 0,
    engagementRate: 0,
    dataReliability: 'not_found',
  };

  const lowResult = calculateSecurityScore(emptyProfile);
  assert.ok(lowResult.score <= 39, `Expected score <= 39, got ${lowResult.score}`);
  assert.equal(lowResult.color, '#ef4444', 'Low score 0-39% must be Red #ef4444');
  assert.equal(lowResult.level, 'critical');
});

test('diagnoseProfileProblems detects missing bio and low engagement', () => {
  const dummyProfile: TikTokProfile = {
    username: 'test_user',
    displayName: 'Test',
    avatar: 'https://example.com/avatar.jpg',
    bio: '',
    verified: false,
    privateAccount: false,
    followersCount: 10000,
    followingCount: 200,
    likesCount: 5000,
    videoCount: 3,
    originalUrl: 'https://www.tiktok.com/@test_user',
    engagementRate: 0.8,
    avgLikesPerVideo: 1666,
    dataReliability: 'verified_public',
    scannedAt: new Date().toISOString(),
  };

  const problems = diagnoseProfileProblems(dummyProfile);
  const problemIds = problems.map((p) => p.id);

  assert.ok(problemIds.includes('missing_bio'), 'Should detect missing bio');
  assert.ok(problemIds.includes('low_engagement'), 'Should detect low engagement');
  assert.ok(problemIds.includes('low_activity'), 'Should detect low activity');
});

test('calculateOrderPrice applies coupons and calculates IQD correctly', () => {
  // Pro monthly: 19,000 IQD. With SABR2026 (20% off) -> 15,200 IQD
  const priceResult = calculateOrderPrice('pro', 'monthly', 'SABR2026');
  assert.equal(priceResult.baseAmountIQD, 19000);
  assert.equal(priceResult.discountIQD, 3800);
  assert.equal(priceResult.finalAmountIQD, 15200);
  assert.ok(priceResult.couponApplied);
  assert.equal(priceResult.couponApplied.percent, 20);

  // Pro yearly without coupon: 190,000 IQD
  const yearlyResult = calculateOrderPrice('pro', 'yearly');
  assert.equal(yearlyResult.baseAmountIQD, 190000);
  assert.equal(yearlyResult.discountIQD, 0);
  assert.equal(yearlyResult.finalAmountIQD, 190000);
});
