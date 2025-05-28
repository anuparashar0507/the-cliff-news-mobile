export interface EBook {
    id: string;
    title: string;
    author: string;
    description: string;
    thumbnail: string; // Assuming a path structure like '@/assets/ebooks/thumbnails/ID.png'
    pdfPath: string;   // Assuming a path structure like '@/assets/ebooks/pdfs/FILENAME.pdf'
    category: 'religious' | 'novels';
    fileSize: string;
    pages: number;
    language: 'hindi' | 'english' | 'both';
}

export const ebooksData: EBook[] = [
    // From your image
    {
        id: '1984',
        title: '1984',
        author: 'George Orwell',
        description: 'A dystopian social science fiction novel and cautionary tale.',
        thumbnail: require('@/assets/ebooks/thumbnails/1984_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/1984_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'aesops-fables',
        title: 'Aesop\'s Fables',
        author: 'Aesop',
        description: 'A collection of fables credited to Aesop, a slave and storyteller believed to have lived in ancient Greece.',
        thumbnail: require('@/assets/ebooks/thumbnails/aesops-fables_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/aesops-fables_Redacted.pdf'),
        category: 'novels', // Or 'classics' if you had that category
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'agnes-grey',
        title: 'Agnes Grey',
        author: 'Anne Brontë',
        description: 'A novel by Anne Brontë, first published in December 1847.',
        thumbnail: require('@/assets/ebooks/thumbnails/agnes-grey_Redacted 2.png'),
        pdfPath: require('@/assets/ebooks/pdfs/agnes-grey_Redacted 2.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'alices-adventures-in-wonderland',
        title: 'Alice\'s Adventures in Wonderland',
        author: 'Lewis Carroll',
        description: 'A fantasy novel about a young girl named Alice who falls through a rabbit hole into a whimsical world.',
        thumbnail: require('@/assets/ebooks/thumbnails/alices-adventures-in-wonderland_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/alices-adventures-in-wonderland_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'anne-of-green-gables',
        title: 'Anne of Green Gables',
        author: 'L. M. Montgomery',
        description: 'A 1908 novel by Canadian author Lucy Maud Montgomery.',
        thumbnail: require('@/assets/ebooks/thumbnails/anne-of-green-gables_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/anne-of-green-gables_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'bhagwat-geeta', // Assuming this is a version of Bhagavad Gita
        title: 'Bhagwat Geeta',
        author: 'Vyasa',
        description: 'The sacred text of Hindu philosophy and spirituality.',
        thumbnail: require('@/assets/ebooks/thumbnails/bhagwatgeeta_2.png'),
        pdfPath: require('@/assets/ebooks/pdfs/bhagwatgeeta_2.pdf'),
        category: 'religious',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'hindi', // Assuming based on the spelling "bhagwat"
    },
    {
        id: 'dracula',
        title: 'Dracula',
        author: 'Bram Stoker',
        description: 'An 1897 Gothic horror novel by Irish author Bram Stoker.',
        thumbnail: require('@/assets/ebooks/thumbnails/dracula_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/dracula_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'gullivers-travels',
        title: 'Gulliver\'s Travels',
        author: 'Jonathan Swift',
        description: 'A prose satire of 1726 by Irish writer and clergyman Jonathan Swift.',
        thumbnail: require('@/assets/ebooks/thumbnails/gullivers-travels_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/gullivers-travels_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'oliver-twist',
        title: 'Oliver Twist',
        author: 'Charles Dickens',
        description: 'Charles Dickens\'s second novel, published as a serial 1837–39.',
        thumbnail: require('@/assets/ebooks/thumbnails/oliver-twist_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/oliver-twist_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'pride-and-prejudice',
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        description: 'An 1813 romantic novel of manners written by Jane Austen.',
        thumbnail: require('@/assets/ebooks/thumbnails/pride-and-prejudice_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/pride-and-prejudice_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'robinson-crusoe',
        title: 'Robinson Crusoe',
        author: 'Daniel Defoe',
        description: 'A novel by Daniel Defoe, first published on 25 April 1719.',
        thumbnail: require('@/assets/ebooks/thumbnails/robinson-crusoe_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/robinson-crusoe_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'the-adventures-of-huckleberry-finn',
        title: 'The Adventures of Huckleberry Finn',
        author: 'Mark Twain',
        description: 'A novel by Mark Twain, first published in the United Kingdom in December 1884.',
        thumbnail: require('@/assets/ebooks/thumbnails/the-adventures-of-huckleberry-finn_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/the-adventures-of-huckleberry-finn_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'the-adventures-of-tom-sawyer',
        title: 'The Adventures of Tom Sawyer',
        author: 'Mark Twain',
        description: 'An 1876 novel by Mark Twain about a boy growing up along the Mississippi River.',
        thumbnail: require('@/assets/ebooks/thumbnails/the-adventures-of-tom-sawyer_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/the-adventures-of-tom-sawyer_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'the-idiot',
        title: 'The Idiot',
        author: 'Fyodor Dostoevsky',
        description: 'A novel by the 19th-century Russian author Fyodor Dostoevsky, first published serially in 1868–69.',
        thumbnail: require('@/assets/ebooks/thumbnails/the-idiot_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/the-idiot_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'the-odyssey',
        title: 'The Odyssey',
        author: 'Homer',
        description: 'One of two major ancient Greek epic poems attributed to Homer.',
        thumbnail: require('@/assets/ebooks/thumbnails/the-odyssey_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/the-odyssey_Redacted.pdf'),
        category: 'novels', // Or 'classics'/'epic poetry'
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'the-thirty-nine-steps',
        title: 'The Thirty-Nine Steps',
        author: 'John Buchan',
        description: 'An adventure novel by the Scottish author John Buchan, first published in 1915.',
        thumbnail: require('@/assets/ebooks/thumbnails/the-thirty-nine-steps_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/the-thirty-nine-steps_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'utopia',
        title: 'Utopia',
        author: 'Thomas More',
        description: 'A work of fiction and socio-political satire by Thomas More, written in Latin and published in 1516.',
        thumbnail: require('@/assets/ebooks/thumbnails/utopia_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/utopia_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'women-in-love',
        title: 'Women in Love',
        author: 'D. H. Lawrence',
        description: 'A novel by British author D. H. Lawrence, published in 1920.',
        thumbnail: require('@/assets/ebooks/thumbnails/women-in-love_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/women-in-love_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },
    {
        id: 'wuthering-heights',
        title: 'Wuthering Heights',
        author: 'Emily Brontë',
        description: 'Emily Brontë\'s only novel, published in 1847 under the pseudonym "Ellis Bell".',
        thumbnail: require('@/assets/ebooks/thumbnails/wuthering-heights_Redacted.png'),
        pdfPath: require('@/assets/ebooks/pdfs/wuthering-heights_Redacted.pdf'),
        category: 'novels',
        fileSize: 'N/A',
        pages: 0, // Placeholder
        language: 'english',
    },

];

export const getBooksByCategory = (category: 'religious' | 'novels'): EBook[] => {
    return ebooksData.filter(book => book.category === category);
};

export const getBookById = (id: string): EBook | undefined => {
    return ebooksData.find(book => book.id === id);
};