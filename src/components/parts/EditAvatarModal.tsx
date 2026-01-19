import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useSettingsStore } from '../../store/settingsStore';
import { updatePart } from '../../sync/yjsProvider';
import type { Part } from '../../models/types';

interface EditAvatarModalProps {
  part: Part;
  isOpen: boolean;
  onClose: () => void;
}

export function EditAvatarModal({ part, isOpen, onClose }: EditAvatarModalProps) {
  const falApiKey = useSettingsStore((state) => state.falApiKey);

  const [avatarPrompt, setAvatarPrompt] = useState(part.avatarPrompt || '');
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(part.avatarUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!avatarPrompt.trim()) {
      setError('Please enter an avatar description');
      return;
    }

    if (!falApiKey) {
      setError('Please set your FAL API key in Settings first');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const prompt = `Final Fantasy character portrait, JRPG art style, detailed anime face, dramatic lighting, fantasy costume, flowing hair, ${avatarPrompt}, painterly style, vibrant colors, ethereal atmosphere, character design by Tetsuya Nomura`;

      console.log('[Avatar] Generating with prompt:', prompt);
      console.log('[Avatar] Using API key:', falApiKey.substring(0, 8) + '...');

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
        setPreviewUrl(data.images[0].url);
      } else {
        console.error('[Avatar] No images in response:', data);
        throw new Error('No image returned');
      }
    } catch (err) {
      console.error('[Avatar] Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    updatePart(part.id, {
      avatarUrl: previewUrl,
      avatarPrompt: avatarPrompt.trim() || undefined,
    });
    onClose();
  };

  const handleClose = () => {
    setAvatarPrompt(part.avatarPrompt || '');
    setPreviewUrl(part.avatarUrl);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Edit Avatar: ${part.name}`}>
      <div className="space-y-4 min-w-[280px]">
        {/* Current & Preview */}
        <div className="flex gap-4 justify-center">
          {/* Current */}
          <div className="text-center">
            <p className="text-[8px] text-[var(--color-pixel-text-dim)] mb-1">Current</p>
            <div className="w-16 h-16 border-2 border-[#666] bg-[var(--color-pixel-bg)] overflow-hidden">
              {part.avatarUrl ? (
                <img
                  src={part.avatarUrl}
                  alt="Current"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[20px] text-[var(--color-pixel-text-dim)]">
                  {part.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center text-[var(--color-pixel-text-dim)]">→</div>

          {/* Preview */}
          <div className="text-center">
            <p className="text-[8px] text-[var(--color-pixel-text-dim)] mb-1">New</p>
            <div className="w-16 h-16 border-2 border-[var(--color-pixel-accent)] bg-[var(--color-pixel-bg)] overflow-hidden">
              {isGenerating ? (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="animate-spin text-[var(--color-pixel-accent)]">*</span>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--color-pixel-text-dim)]">
                  ?
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-[9px] text-[var(--color-pixel-text-dim)] mb-1">
            Describe the avatar
          </label>
          <input
            type="text"
            value={avatarPrompt}
            onChange={(e) => setAvatarPrompt(e.target.value)}
            placeholder="e.g., hungry monster, wise sage..."
            className="w-full px-2 py-1 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[10px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
          />
        </div>

        {/* Generate Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating || !avatarPrompt.trim()}
          className="w-full"
        >
          {isGenerating ? 'Generating...' : 'Generate Avatar'}
        </Button>

        {/* Error */}
        {error && (
          <p className="text-[var(--color-pixel-error)] text-[9px]">{error}</p>
        )}

        {/* No API Key Warning */}
        {!falApiKey && (
          <p className="text-[var(--color-pixel-warning)] text-[8px]">
            Set your FAL API key in Settings → Avatar Generation
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!previewUrl || previewUrl === part.avatarUrl}
          >
            Save Avatar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default EditAvatarModal;
