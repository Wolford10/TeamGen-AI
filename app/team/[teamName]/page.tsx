'use client'
import React, { useState, useEffect } from 'react';

interface TeamPageProps {
  params: Promise<{ teamName: string }>;
}

interface MascotData {
  mascotName: string;
  mascotAnimal: string;
  mascotPersonality: string;
  description: string;
}

// Fallback mock generator (in case API fails)
function generateMockMascotAndDescription(teamName: string): MascotData {
  const mascots = [
    { name: 'Frostbite', animal: 'polar bear', personality: 'fearless and loves snowball fights' },
    { name: 'Blaze', animal: 'dragon', personality: 'fiery and energetic' },
    { name: 'Bolt', animal: 'cheetah', personality: 'lightning-fast and playful' },
    { name: 'Tank', animal: 'rhino', personality: 'unstoppable and tough' },
    { name: 'Echo', animal: 'owl', personality: 'wise and mysterious' },
    { name: 'Splash', animal: 'dolphin', personality: 'cheerful and clever' },
  ];
  const idx = teamName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % mascots.length;
  const mascot = mascots[idx];
  
  return {
    mascotName: mascot.name,
    mascotAnimal: mascot.animal,
    mascotPersonality: mascot.personality,
    description: `The ${teamName} are known for their ${mascot.personality}. With their mascot ${mascot.name} the ${mascot.animal} leading the charge, they bring unique energy and style to every game!`
  };
}

// Server-side data fetching
async function getMascotData(teamName: string): Promise<MascotData> {
  try {
    console.log('Fetching mascot data for:', teamName);
    
    // Call our API route from the server
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/generate-mascot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teamName }),
      cache: 'no-store', // Ensure fresh data
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API response error:', errorText);
      throw new Error(`Failed to generate mascot data: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received mascot data:', data);
    return data;
  } catch (err) {
    console.error('Error generating mascot:', err);
    console.log('Using fallback data for:', teamName);
    // Use fallback data
    return generateMockMascotAndDescription(teamName);
  }
}

// PaywallModal component (reuse from PromptForm)
function PaywallModal({ show, onClose }: { show: boolean, onClose: () => void }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="text-4xl mb-2">🛑 Hold up, Coach!</div>
        <div className="text-lg font-bold mb-4 text-gray-800">You&apos;ve hit your free image limit.</div>
        <div className="mb-4 text-gray-700">
          Ready to build more dream squads, generate custom mascot art, and unlock limitless creativity?
        </div>
        <div className="bg-yellow-100 rounded-lg p-4 mb-4 text-left">
          <div className="mb-2 text-xl font-semibold text-gray-800">🔓 Unlock unlimited access for just <span className='text-green-600'>$3.99</span> (one-time)</div>
          <ul className="list-disc list-inside text-gray-800 text-left">
            <li>✅ Unlimited team name generations</li>
            <li>✅ Mascot + logo image generation</li>
            <li>✅ No account needed — instant access</li>
          </ul>
        </div>
        <a
          href="#stripe-link-placeholder"
          className="inline-block w-full py-3 rounded-full bg-purple-600 text-white font-bold text-lg mb-2 hover:bg-purple-700 transition"
        >
          Unlock Now
        </a>
        <div className="text-xs text-gray-500">One-time payment. Instant access. No recurring fees.</div>
      </div>
    </div>
  );
}

const TeamPage = ({ params }: TeamPageProps) => {
  const [teamName, setTeamName] = useState<string>('');
  const [mascotData, setMascotData] = useState<MascotData | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoLoading, setLogoLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userHasPaid, setUserHasPaid] = useState(false);
  const [imageGenCount, setImageGenCount] = useState(0);

  const [imageBlocked, setImageBlocked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paidImageCapReached, setPaidImageCapReached] = useState(false);

  useEffect(() => {
    async function loadTeamData() {
      try {
        const resolvedParams = await params;
        const decodedTeamName = decodeURIComponent(resolvedParams.teamName);
        setTeamName(decodedTeamName);
        
        console.log('Team page rendering for:', decodedTeamName);
        
        // Fetch data server-side
        const data = await getMascotData(decodedTeamName);
        console.log('Final mascot data for rendering:', data);
        setMascotData(data);
      } catch (err) {
        console.error('Error loading team data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTeamData();
  }, [params]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserHasPaid(localStorage.getItem('userHasPaid') === 'true');
      // Free user: 1 image total
      const count = parseInt(localStorage.getItem('imageGenCount') || '0', 10);
      setImageGenCount(count);
      if (localStorage.getItem('userHasPaid') !== 'true' && count >= 1) {
        setImageBlocked(true);
        // Don't automatically show paywall - only show when user tries to generate
      }
      // Paid user: 25 images per day
      if (localStorage.getItem('userHasPaid') === 'true') {
        const today = new Date().toISOString().slice(0, 10);
        const paidDate = localStorage.getItem('paidImageGenDate') || '';
        let paidCount = parseInt(localStorage.getItem('paidImageGenCount') || '0', 10);
        if (paidDate !== today) {
          paidCount = 0;
          localStorage.setItem('paidImageGenDate', today);
          localStorage.setItem('paidImageGenCount', '0');
        }

        setImageGenCount(paidCount);
        if (paidCount >= 25) {
          setPaidImageCapReached(true);
        }
      }
    }
  }, []);

  const incrementImageCount = () => {
    if (typeof window === 'undefined') return;
    if (!userHasPaid) {
      const newCount = imageGenCount + 1;
      localStorage.setItem('imageGenCount', newCount.toString());
      setImageGenCount(newCount);
      if (newCount >= 1) {
        setImageBlocked(true);
        setShowPaywall(true);
      }
    } else {
      const today = new Date().toISOString().slice(0, 10);
      let paidDate = localStorage.getItem('paidImageGenDate') || '';
      let paidCount = parseInt(localStorage.getItem('paidImageGenCount') || '0', 10);
      if (paidDate !== today) {
        paidDate = today;
        paidCount = 0;
        localStorage.setItem('paidImageGenDate', today);
        localStorage.setItem('paidImageGenCount', '0');
      }
      paidCount += 1;
      localStorage.setItem('paidImageGenCount', paidCount.toString());
      setImageGenCount(paidCount);
      if (paidCount >= 25) {
        setPaidImageCapReached(true);
      }
    }
  };

  const generateImage = async () => {
    if (!mascotData) return;
    if (imageBlocked || paidImageCapReached) {
      setShowPaywall(true);
      return;
    }
    setImageLoading(true);
    try {
      const mascotPrompt = `Cartoon-style ${mascotData.mascotAnimal} mascot named ${mascotData.mascotName} wearing a ${teamName} jersey, ${mascotData.mascotPersonality}`;
      
      console.log('Sending image generation request with prompt:', mascotPrompt);
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: mascotPrompt }),
      });

      console.log('Image API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Image API error response:', errorText);
        throw new Error(`Failed to generate image: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Image API success response:', data);
      setImageUrl(data.imageUrl);
      incrementImageCount();
    } catch (err) {
      console.error('Error generating image:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Image generation failed: ${errorMessage}`);
    } finally {
      setImageLoading(false);
    }
  };

  const logoPrompt = mascotData
    ? `Modern sports team logo for the ${teamName} featuring a ${mascotData.mascotAnimal} mascot named ${mascotData.mascotName}, bold, simple, vector style`
    : '';

  const generateLogo = async () => {
    if (!mascotData) return;
    if (imageBlocked || paidImageCapReached) {
      setShowPaywall(true);
      return;
    }
    setLogoLoading(true);
    try {
      const response = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: logoPrompt }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate logo: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      setLogoUrl(data.imageUrl);
      incrementImageCount();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Logo generation failed: ${errorMessage}`);
    } finally {
      setLogoLoading(false);
    }
  };

  if (loading || !mascotData) {
    return (
      <div className="chat-container flex flex-col min-h-screen items-center justify-start py-8 px-2">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-white">Loading team data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-start py-10 px-2 bg-transparent">
      {/* Mascot & Logo Images Side-by-Side */}
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-8 w-full">
        {/* Mascot Image Card */}
        <div className="flex flex-col items-center">
          <div className="w-64 h-64 bg-gray-800 rounded-full flex items-center justify-center shadow-2xl border-4 border-white overflow-hidden mb-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${mascotData.mascotName} mascot`}
                className="w-full h-full object-cover rounded-full"
              />
            ) : imageLoading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-2"></div>
                <span className="text-gray-300 text-sm">Generating...</span>
              </div>
            ) : (
              <span className="text-gray-300 text-lg">[Mascot Image]</span>
            )}
          </div>
          <button
            onClick={generateImage}
            disabled={imageLoading || imageBlocked || paidImageCapReached}
            className="px-6 py-2 bg-blue-600 text-white rounded-full text-base font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow mb-2"
          >
            {imageLoading ? 'Generating...' : 'Generate Mascot'}
          </button>
        </div>
        {/* Logo Image Card */}
        <div className="flex flex-col items-center">
          <div className="w-64 h-64 bg-gray-800 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white overflow-hidden mb-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${teamName} logo`}
                className="w-full h-full object-cover"
              />
            ) : logoLoading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-2"></div>
                <span className="text-gray-300 text-sm">Generating...</span>
              </div>
            ) : (
              <span className="text-gray-300 text-lg">[Team Logo]</span>
            )}
          </div>
          <button
            onClick={generateLogo}
            disabled={logoLoading || imageBlocked || paidImageCapReached}
            className="px-6 py-2 bg-blue-600 text-white rounded-full text-base font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow mb-2"
          >
            {logoLoading ? 'Generating...' : 'Generate Logo'}
          </button>
        </div>
      </div>
      {/* Team Name */}
      <h1 className="text-5xl font-extrabold text-white mb-10 tracking-tight text-center">{teamName}</h1>
      {/* Mascot Section */}
      <div className="w-full max-w-xl flex flex-col items-center mb-8">
        <div className="w-full rounded-full px-6 py-2 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold text-xl text-center mb-3">
          🦁 Mascot
        </div>
        <div className="w-full rounded-2xl px-6 py-5 bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-medium text-lg text-center">
          <div className="mb-2"><span className="font-bold">Mascot Name:</span> <span className="italic">{mascotData.mascotName} ({mascotData.mascotAnimal})</span></div>
          <div><span className="font-bold">Mascot Personality:</span> {mascotData.mascotPersonality.charAt(0).toUpperCase() + mascotData.mascotPersonality.slice(1)}</div>
        </div>
      </div>
      {/* Team Description Section */}
      <div className="w-full max-w-xl flex flex-col items-center mb-8">
        <div className="w-full rounded-full px-6 py-2 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold text-xl text-center mb-3">
          📖 Team Description
        </div>
        <div className="w-full rounded-2xl px-6 py-5 bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-medium text-lg text-center leading-relaxed">
          {mascotData.description}
        </div>
      </div>
      {/* Image generation limit messages */}
      {imageBlocked && !userHasPaid && (
        <div className="mt-4 text-center text-red-400 font-semibold">
          You have reached your 1 free image generation.<br />
          <button
            className="underline text-blue-400 hover:text-blue-600 mt-2"
            onClick={() => setShowPaywall(true)}
          >
            Upgrade to unlock mascot and logo images!
          </button>
        </div>
      )}
      {userHasPaid && paidImageCapReached && (
        <div className="mt-4 text-center text-yellow-500 font-semibold">
          You&apos;ve hit today&apos;s limit. Come back tomorrow for more team-building action!
        </div>
      )}
      <PaywallModal show={showPaywall && imageBlocked && !userHasPaid} onClose={() => setShowPaywall(false)} />
    </div>
  );
};

export default TeamPage; 