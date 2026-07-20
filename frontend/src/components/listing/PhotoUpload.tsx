type PhotoUploadProps = {
  files: File[];
  onChange: (files: File[]) => void;
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function PhotoUpload({ files, onChange }: PhotoUploadProps) {
  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) {
      return;
    }

    const validFiles = Array.from(incoming).filter(
      (file) => ALLOWED_TYPES.includes(file.type) && file.size <= 5 * 1024 * 1024,
    );
    onChange([...files, ...validFiles].slice(0, 10));
  };

  return (
    <div className="space-y-4 rounded-3xl border border-dashed border-ink/20 bg-white p-4">
      <label className="block cursor-pointer rounded-2xl bg-sand p-6 text-center">
        <input
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          multiple
          onChange={(event) => handleFiles(event.target.files)}
          type="file"
        />
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFiles(event.dataTransfer.files);
          }}
        >
          <span className="text-sm font-medium">Drag photos here or click to browse</span>
        </div>
        <p className="mt-2 text-xs text-ink/60">Minimum 3 photos, maximum 10, up to 5MB each</p>
      </label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((file, index) => (
          <div className="rounded-2xl border border-ink/10 bg-sand p-3" key={`${file.name}-${index}`}>
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-ink/60">{Math.round(file.size / 1024)} KB</p>
            <button
              className="mt-3 text-sm text-clay"
              onClick={() => onChange(files.filter((_, currentIndex) => currentIndex !== index))}
              type="button"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
