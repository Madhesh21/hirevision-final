const { HfInference } = require('@huggingface/inference');



// Validate key at module load time (fails fast if missing)
if (!process.env.HUGGINGFACE_API_KEY) {
  console.error('FATAL: HUGGINGFACE_API_KEY is missing from env. Get one free from huggingface.co/settings/tokens');
  process.exit(1);  // Or handle gracefully in production
}

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// TEMP DEBUG: Confirm init (remove after testing)
console.log('DEBUG: HfInference initialized with key (length: ' + process.env.HUGGINGFACE_API_KEY.length + ')');

async function createEmbeddings(text) {
  try {
    // Generate embedding using a lightweight, accurate model
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: text,
    });

    // TEMP DEBUG: Inspect response shape (remove after fix)
    console.log('DEBUG: Response type:', typeof response, 'Is array?', Array.isArray(response), 'Length:', response?.length);

    // Quick validation: Ensure it's an array of numbers
    if (!Array.isArray(response) || response.length === 0) {
      throw new Error(`Invalid embedding response: expected array of numbers, got ${typeof response}`);
    }

    // L2-normalize the vector (standard for cosine similarity)
    const embedding = normalizeEmbedding(response);

    return embedding;
  } catch (error) {
    console.error('Error creating embeddings:', error);
    throw error;
  }
}

// Helper: Normalize to unit vector
function normalizeEmbedding(vec) {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val ** 2, 0));
  return vec.map(val => val / (norm || 1));  // Avoid div by 0
}

module.exports = { createEmbeddings };