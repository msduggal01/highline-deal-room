/* Highline Deal Room — the mandate board.
   This is the ONLY file to edit when a mandate is added, changed or closed.
   Rules:
   - Never put a price in here. Use "Price on request" / "On request".
   - ref format: HBC-<L|R|F|B>-<3 digits>  (L land, R real estate, F project finance, B business sale)
   - cat must be one of: "Land", "Real estate", "Project finance", "Business sale"
   - The first mandate in the list is shown as the large featured card.
   - docs = names of documents in the pack (released after NDA). Names only, never the files.
   - To take a mandate off the board, delete its block (or set published:false).
*/
window.MANDATES = [
  {
    ref: 'HBC-L-001',
    cat: 'Land',
    title: '34-acre land parcel, Thane',
    loc: 'Thane, Maharashtra, India',
    body: 'A contiguous land holding in the Thane belt, suited to residential township, logistics or mixed-use development. Outright sale.',
    facts: { Size: '34 acres', Structure: 'Outright sale', Valuation: 'Price on request', Status: 'Title documents in hand' },
    docs: ['7/12 extracts', 'Title search report', 'Encumbrance certificate', 'Zoning / DP remarks', 'Mandate letter'],
    status: 'Accepting LOIs',
    published: true
  },
  {
    ref: 'HBC-F-002',
    cat: 'Project finance',
    title: 'Gas station project funding, up to 100%',
    loc: 'United States',
    body: 'Funding available for fuel retail and gas station projects in the US — acquisitions, ground-up builds or refinancing — covering up to 100% of project cost for qualifying sponsors.',
    facts: { Funding: 'Up to 100% of project cost', Use: 'Acquisition, build or refinance', Terms: 'On request', Status: 'Open to sponsors' },
    docs: ['Term sheet', 'Sponsor eligibility criteria', 'Required project documents list'],
    status: 'Open to sponsors',
    published: true
  }
];
