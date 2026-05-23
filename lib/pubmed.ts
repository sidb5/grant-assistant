export async function fetchAbstracts(pmids: string[]): Promise<Record<string, string>> {
  if (pmids.length === 0) return {}
  const batches: string[][] = []
  for (let i = 0; i < pmids.length; i += 20) {
    batches.push(pmids.slice(i, i + 20))
  }
  const results: Record<string, string> = {}
  for (const batch of batches) {
    try {
      const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${batch.join(',')}&retmode=xml`
      const response = await fetch(url)
      const xml = await response.text()
      const articleBlocks = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []
      articleBlocks.forEach(block => {
        const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)
        const abstractMatch = block.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/)
        if (pmidMatch && abstractMatch) {
          results[pmidMatch[1]] = abstractMatch[1].replace(/<[^>]+>/g, '').trim()
        }
      })
    } catch {
      // If a batch fails, continue — missing abstracts use empty string
    }
  }
  return results
}
