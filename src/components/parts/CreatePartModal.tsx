import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useUIStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { addPart } from '../../sync/yjsProvider';
import type { Part } from '../../models/types';

// Helper to truncate error messages for display
function truncateError(error: string, maxLen = 100): string {
  if (error.length <= maxLen) return error;
  return error.slice(0, maxLen) + '...';
}

// Simple UUID generator
function generateId(): string {
  return 'part_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function CreatePartModal() {
  const isOpen = useUIStore((state) => state.isCreatePartModalOpen);
  const closeModal = useUIStore((state) => state.closeCreatePartModal);
  const isGeneratingAvatar = useUIStore((state) => state.isGeneratingAvatar);
  const setGeneratingAvatar = useUIStore((state) => state.setGeneratingAvatar);
  const showToast = useUIStore((state) => state.showToast);

  const startingBalance = useSettingsStore((state) => state.startingBalance);
  const startingCreditScore = useSettingsStore((state) => state.startingCreditScore);
  const falApiKey = useSettingsStore((state) => state.falApiKey);

  const [name, setName] = useState('');
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) {
      setError('Please enter an avatar description');
      return;
    }

    if (!falApiKey) {
      setError('Please set your FAL API key in Settings to generate avatars');
      return;
    }

    setError(null);
    setGeneratingAvatar(true);

    try {
      const prompt = `Final Fantasy character portrait, JRPG art style, detailed anime face, dramatic lighting, fantasy costume, flowing hair, ${avatarPrompt}, painterly style, vibrant colors, ethereal atmosphere, character design by Tetsuya Nomura`;

      console.log('[Avatar] Generating with prompt:', prompt);
      console.log('[Avatar] Using API key:', falApiKey.substring(0, 8) + '...');

      // Call FAL AI API to generate avatar
      const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image_size: 'square',
          num_images: 1,
        }),
      });

      console.log('[Avatar] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Avatar] API error response:', errorText);
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('[Avatar] Response data:', data);

      if (data.images && data.images.length > 0) {
        console.log('[Avatar] Generated successfully:', data.images[0].url);
        setAvatarUrl(data.images[0].url);
      } else {
        console.error('[Avatar] No images in response:', data);
        throw new Error('No image returned from API');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate avatar';
      console.error('[Avatar] Generation failed:', errorMsg, err);
      setError(truncateError(errorMsg));
      showToast(`Avatar generation failed: ${truncateError(errorMsg, 80)}`, 'error', 8000);
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    const now = new Date().toISOString();
    const newPart: Part = {
      id: generateId(),
      name: name.trim(),
      avatarUrl,
      avatarPrompt: avatarPrompt.trim() || undefined,
      balance: startingBalance,
      creditScore: startingCreditScore,
      createdAt: now,
      updatedAt: now,
    };

    addPart(newPart);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setAvatarPrompt('');
    setAvatarUrl(undefined);
    setError(null);
    closeModal();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Part">
      <div className="space-y-4 min-w-[300px]">
        {/* Name Input */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter part name..."
            className="w-full px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
          />
        </div>

        {/* Avatar Prompt */}
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            Avatar Description (optional)
          </label>
          <input
            type="text"
            value={avatarPrompt}
            onChange={(e) => setAvatarPrompt(e.target.value)}
            placeholder="e.g., brave warrior, wise elder..."
            className="w-full px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
          />
        </div>

        {/* Avatar Preview & Generate Button */}
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div className="w-20 h-20 flex-shrink-0 border-2 border-[#888] bg-[var(--color-pixel-bg)] overflow-hidden">
            {isGeneratingAvatar ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin text-[var(--color-pixel-accent)]">*</div>
              </div>
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Generated avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-pixel-text-dim)] text-[10px]">
                Preview
              </div>
            )}
          </div>

          {/* Generate Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerateAvatar}
            disabled={isGeneratingAvatar || !avatarPrompt.trim()}
          >
            {isGeneratingAvatar ? 'Generating...' : 'Generate Avatar'}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-[var(--color-pixel-error)] text-[10px]">{error}</p>
        )}

        {/* Starting Stats Info */}
        <div className="text-[10px] text-[var(--color-pixel-text-dim)] bg-[var(--color-pixel-bg)] p-2 border border-[#444]">
          <p>Starting Balance: ${startingBalance.toLocaleString()}</p>
          <p>Starting Credit Score: {startingCreditScore}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={!name.trim()}>
            Create Part
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CreatePartModal;
