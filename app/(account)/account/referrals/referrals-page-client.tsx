'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Gift, Award, Copy, Check } from 'lucide-react';

interface ReferralsPageClientProps {
  referrals: any;
  earnedScratchCards: any;
  scratchedCards: any;
  channelPoints: any;
  customerId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  REGISTERED: 'bg-blue-100 text-blue-700 border-blue-200',
  ELIGIBLE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CLAIMED: 'bg-green-100 text-green-700 border-green-200',
  EXPIRED: 'bg-red-100 text-red-700 border-red-200',
};

function ScratchCard({
  referral,
  onScratched,
  onClaimed,
}: {
  referral: any;
  onScratched: (referralNumber: number) => void;
  onClaimed: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasCalledScratch = useRef(false);
  const [isScratching, setIsScratching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Golden gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#D4AF37');
    gradient.addColorStop(0.5, '#F5D060');
    gradient.addColorStop(1, '#D4AF37');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add sparkle dots
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      const sr = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`;
      ctx.fill();
    }

    // "Scratch Here!" text
    ctx.fillStyle = '#8B6914';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Scratch Here!', canvas.width / 2, canvas.height / 2);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Calculate scratch percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    const pct = (transparent / (imageData.data.length / 4)) * 100;
    setScratchPercentage(pct);

    if (pct > 5 && !hasCalledScratch.current) {
      hasCalledScratch.current = true;
      // Auto-clear the remaining canvas for a smooth full reveal
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setIsRevealed(true);
      onScratched(referral.referralNumber);

      // Show reward for 5 seconds, then mark as claimed
      setTimeout(() => {
        setIsClaimed(true);
        onClaimed();
      }, 5000);
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(true);
    const { x, y } = getPos(e);
    scratch(x, y);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    scratch(x, y);
  };

  const handleEnd = () => setIsScratching(false);

  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      <div className="bg-white rounded-xl shadow-lg border-2 border-amber-200 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 text-center">
          <p className="text-sm font-medium text-gray-600">Referral #{referral.referralNumber}</p>
          <p className="text-xs text-gray-500">
            {referral.referredCustomer?.firstName} {referral.referredCustomer?.lastName}
          </p>
        </div>
        <div className="relative h-[140px]">
          {/* Content underneath */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
            {isClaimed ? (
              <>
                <div className="text-2xl mb-1 text-green-600">Claimed</div>
                <p className="text-2xl font-bold text-green-600">
                  {referral.points || 0} Points
                </p>
              </>
            ) : isRevealed ? (
              <>
                <div className="text-3xl mb-1">🎉</div>
                <p className="text-2xl font-bold text-green-600">
                  {referral.points || 0} Points
                </p>
                <p className="text-xs text-green-500 mt-1">Congratulations! Claiming reward...</p>
              </>
            ) : (
              <>
                <Gift className="h-8 w-8 text-amber-400 mb-2" />
                <p className="text-sm text-gray-400">Scratch to reveal</p>
              </>
            )}
          </div>
          {/* Scratch overlay */}
          {!isRevealed && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-pointer touch-none"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function ReferralsPageClient({
  referrals,
  earnedScratchCards,
  scratchedCards,
  channelPoints,
  customerId,
}: ReferralsPageClientProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [justScratchedCards, setJustScratchedCards] = useState<any[]>([]);

  const [origin, setOrigin] = useState('https://swadkerala.com');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);
  const referralLink = `${origin}/?referrerId=${customerId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleScratch = (referralNumber: number) => {
    // Preserve the card locally so it stays visible
    const card = earnedScratchCards?.items?.find(
      (r: any) => r.referralNumber === referralNumber,
    );
    if (card) {
      setJustScratchedCards((prev) => [...prev, card]);
    }
    fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referralNumber }),
    }).catch(() => {});
  };

  const handleClaimed = (referralId: string) => {
    // Remove from justScratchedCards and switch to Claimed tab
    setJustScratchedCards((prev) => prev.filter((c) => c.id !== referralId));
    setActiveTab(2);
    window.location.reload();
  };

  const tabs = [
    { label: 'All Referrals', count: referrals?.totalItems ?? 0 },
    { label: 'Scratch Cards', count: earnedScratchCards?.totalItems ?? 0 },
    { label: 'Claimed', count: scratchedCards?.totalItems ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {referrals?.totalItems ?? 0}
            </p>
            <p className="text-xs text-gray-500">Total Referrals</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 text-center">
            <Gift className="h-6 w-6 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {earnedScratchCards?.totalItems ?? 0}
            </p>
            <p className="text-xs text-gray-500">Scratch Cards</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {scratchedCards?.totalItems ?? 0}
            </p>
            <p className="text-xs text-gray-500">Claimed</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Card */}
      <Card className="bg-gradient-to-r from-navy to-blue-900 text-white shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-2">Your Referral Link</h3>
          <p className="text-sm text-blue-200 mb-4">
            Share this link with friends. When they sign up and make their first purchase,
            you'll earn a scratch card!
          </p>
          {channelPoints && (
            <p className="text-sm text-amber-300 mb-4">
              Each scratch card is worth up to {channelPoints.points} points!
            </p>
          )}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/10 rounded-lg px-4 py-3 text-sm font-mono truncate border border-white/20">
              {referralLink}
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="shrink-0 bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1">
          {tabs.map((tab, idx) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === idx
                  ? 'bg-white text-navy border border-b-0 border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs ${
                  activeTab === idx
                    ? 'bg-navy text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* Tab 1: All Referrals */}
        {activeTab === 0 && (
          <div className="space-y-3">
            {(!referrals?.items || referrals.items.length === 0) ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No referrals yet</p>
                <p className="text-sm">Share your referral link to start earning rewards!</p>
              </div>
            ) : (
              referrals.items.map((referral: any) => (
                <Card key={referral.id} className="bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {referral.referredCustomer?.firstName?.[0] || '?'}
                          {referral.referredCustomer?.lastName?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {referral.referredCustomer?.firstName}{' '}
                            {referral.referredCustomer?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            #{referral.referralNumber} &middot;{' '}
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`${STATUS_COLORS[referral.status] || 'bg-gray-100 text-gray-700'} rounded-full px-3 py-1 text-xs`}
                      >
                        {referral.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Scratch Cards (ELIGIBLE) */}
        {activeTab === 1 && (() => {
          // Merge server cards with locally-preserved just-scratched cards
          const serverIds = new Set(
            (earnedScratchCards?.items ?? []).map((r: any) => r.id),
          );
          const merged = [
            ...(earnedScratchCards?.items ?? []),
            ...justScratchedCards.filter((c) => !serverIds.has(c.id)),
          ];
          return (
            <div>
              {merged.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No scratch cards available</p>
                  <p className="text-sm">Scratch cards appear when your referred friends complete their first order.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {merged.map((referral: any) => (
                    <ScratchCard
                      key={referral.id}
                      referral={referral}
                      onScratched={handleScratch}
                      onClaimed={() => handleClaimed(referral.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Tab 3: Claimed */}
        {activeTab === 2 && (
          <div>
            {(!scratchedCards?.items || scratchedCards.items.length === 0) ? (
              <div className="text-center py-12 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No claimed cards yet</p>
                <p className="text-sm">Scratch your earned cards to claim rewards!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scratchedCards.items.map((referral: any) => (
                  <Card
                    key={referral.id}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm"
                  >
                    <CardContent className="p-5 text-center">
                      <div className="text-2xl mb-2">🎉</div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Referral #{referral.referralNumber}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        {referral.referredCustomer?.firstName}{' '}
                        {referral.referredCustomer?.lastName}
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {referral.points || 0} Points
                      </p>
                      <Badge className="mt-2 bg-green-100 text-green-700 border-green-200 rounded-full">
                        Claimed
                      </Badge>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
