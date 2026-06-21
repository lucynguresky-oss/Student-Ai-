/**
 * Corbett Maths Content Catalogue
 * Source: https://corbettmaths.com/contents/
 *
 * Each topic has: video URL, practice questions URL, and optional textbook PDF URL.
 * Topics are grouped into categories matching the GCSE/KCSE maths syllabus.
 */

export type CorbettTopic = {
  id: string;
  title: string;
  videoUrl: string;
  practiceUrl: string;
  textbookUrl?: string;
};

export type CorbettCategory = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  topics: CorbettTopic[];
};

const CORBETT_MATHS: CorbettCategory[] = [
  {
    key: 'algebra',
    label: 'Algebra',
    emoji: '🔤',
    color: '#7C3AED',
    topics: [
      { id: 'alg-01', title: 'Collecting Like Terms', videoUrl: 'http://corbettmaths.com/2013/12/28/collecting-like-terms-video-9/', practiceUrl: 'https://corbettmaths.com/2019/08/22/collecting-like-terms-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/collecting-like-terms-pdf3.pdf' },
      { id: 'alg-02', title: 'Expanding Brackets', videoUrl: 'http://corbettmaths.com/2013/12/23/expanding-brackets-video-13/', practiceUrl: 'https://corbettmaths.com/2019/08/22/expanding-brackets-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/expanding-brackets-pdf1.pdf' },
      { id: 'alg-03', title: 'Expanding Two Brackets', videoUrl: 'http://corbettmaths.com/2013/12/23/expanding-two-brackets-video-14/', practiceUrl: 'https://corbettmaths.com/2018/04/04/expanding-two-brackets/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/expanding-two-brackets-pdf2.pdf' },
      { id: 'alg-04', title: 'Factorisation', videoUrl: 'http://corbettmaths.com/2013/02/06/factorisation/', practiceUrl: 'https://corbettmaths.com/2019/08/29/factorising-practice-questions/' },
      { id: 'alg-05', title: 'Factorising Quadratics', videoUrl: 'http://corbettmaths.com/2013/02/06/factorising-quadratics-1/', practiceUrl: 'https://corbettmaths.com/2018/04/04/factorising-quadratics/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2018/09/Factorising-Quadratics-pdf.pdf' },
      { id: 'alg-06', title: 'Completing the Square', videoUrl: 'http://corbettmaths.com/2013/12/29/completing-the-square-video-10/', practiceUrl: 'https://corbettmaths.com/2019/08/22/completing-the-square-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/completing-the-square-pdf2.pdf' },
      { id: 'alg-07', title: 'Substitution', videoUrl: 'http://corbettmaths.com/2012/08/20/substitution-into-expressions/', practiceUrl: 'https://corbettmaths.com/2019/08/22/substitution-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/substitution-pdf2.pdf' },
      { id: 'alg-08', title: 'Changing the Subject', videoUrl: 'http://corbettmaths.com/2013/12/23/changing-the-subject-video-7/', practiceUrl: 'https://corbettmaths.com/2018/04/04/changing-the-subject/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/changing-the-subject-pdf1.pdf' },
      { id: 'alg-09', title: 'Indices (Laws of)', videoUrl: 'http://corbettmaths.com/2013/03/13/laws-of-indices-algebra/', practiceUrl: 'https://corbettmaths.com/2018/04/04/laws-of-indices-2/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2019/02/Laws-of-Indices-174-pdf.pdf' },
      { id: 'alg-10', title: 'Algebraic Fractions', videoUrl: 'http://corbettmaths.com/2013/01/19/adding-algebraic-fractions/', practiceUrl: 'https://corbettmaths.com/2019/08/22/algebraic-fractions-practice-questions/' },
    ],
  },
  {
    key: 'equations',
    label: 'Equations',
    emoji: '⚖️',
    color: '#3B82F6',
    topics: [
      { id: 'eq-01', title: 'Solving Equations', videoUrl: 'http://corbettmaths.com/2012/08/24/solving-equations/', practiceUrl: 'https://corbettmaths.com/2019/08/28/solving-equations-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2020/10/Equations-pdf.pdf' },
      { id: 'eq-02', title: 'Equations with Fractions', videoUrl: 'http://corbettmaths.com/2013/05/25/algebraic-equations/', practiceUrl: 'https://corbettmaths.com/2019/08/29/equations-involving-fractions-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2018/09/Fractional-Equations-pdf.pdf' },
      { id: 'eq-03', title: 'Letters Both Sides', videoUrl: 'http://corbettmaths.com/2012/08/24/solving-equations-with-letters-on-both-sides/', practiceUrl: 'https://corbettmaths.com/2019/08/28/solving-equations-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2018/11/Equations-letters-both-sides-pdf.pdf' },
      { id: 'eq-04', title: 'Quadratic Formula', videoUrl: 'http://corbettmaths.com/2013/04/24/quadratic-formula/', practiceUrl: 'https://corbettmaths.com/2019/09/05/quadratic-formula-practice-questions/' },
      { id: 'eq-05', title: 'Simultaneous Equations', videoUrl: 'http://corbettmaths.com/2013/03/05/simultaneous-equations-elimination-method/', practiceUrl: 'https://corbettmaths.com/2019/09/05/simultaneous-equations-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2019/04/Simultaneous-Equations.pdf' },
      { id: 'eq-06', title: 'Inequalities', videoUrl: 'http://corbettmaths.com/2013/05/18/inequalities/', practiceUrl: 'https://corbettmaths.com/2019/08/29/inequalities-practice-questions/' },
    ],
  },
  {
    key: 'number',
    label: 'Number',
    emoji: '🔢',
    color: '#22C55E',
    topics: [
      { id: 'num-01', title: 'Fractions: Addition', videoUrl: 'http://corbettmaths.com/2012/08/21/fractions-addition-and-subtraction/', practiceUrl: 'https://corbettmaths.com/2018/04/04/adding-fractions/' },
      { id: 'num-02', title: 'Fractions: Multiplication', videoUrl: 'http://corbettmaths.com/2012/08/21/multiplying-fractions-2/', practiceUrl: 'https://corbettmaths.com/2019/09/02/multiplying-fractions-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2018/12/Multiplying-Fractions-pdf.pdf' },
      { id: 'num-03', title: 'Fractions: Division', videoUrl: 'http://corbettmaths.com/2012/08/21/division-with-fractions/', practiceUrl: 'https://corbettmaths.com/2018/04/04/dividing-fractions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2018/11/Dividing-Fractions-pdf.pdf' },
      { id: 'num-04', title: 'Percentages of Amount', videoUrl: 'http://corbettmaths.com/2012/08/20/percentages-of-amounts-non-calculator/', practiceUrl: 'https://corbettmaths.com/2019/09/02/percentages-of-an-amount-non-calculator-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2018/11/Percentages-of-amounts-234-pdf.pdf' },
      { id: 'num-05', title: 'Compound Interest', videoUrl: 'http://corbettmaths.com/2012/08/21/compound-interest/', practiceUrl: 'https://corbettmaths.com/2019/09/02/compound-interest-practice-questions/' },
      { id: 'num-06', title: 'Reverse Percentages', videoUrl: 'http://corbettmaths.com/2013/02/15/reverse-percentages/', practiceUrl: 'https://corbettmaths.com/2019/09/04/reverse-percentages-practice-questions/' },
      { id: 'num-07', title: 'Ratio: Sharing', videoUrl: 'http://corbettmaths.com/2013/03/03/ratio-sharing-the-total/', practiceUrl: 'https://corbettmaths.com/wp-content/uploads/2018/06/Ratio-pdf.pdf', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/ratio-sharing-the-total-pdf.pdf' },
      { id: 'num-08', title: 'Standard Form', videoUrl: 'http://corbettmaths.com/2013/04/28/standard-form/', practiceUrl: 'https://corbettmaths.com/2019/08/29/standard-form-practice-questions/' },
      { id: 'num-09', title: 'Surds', videoUrl: 'http://corbettmaths.com/2013/05/11/surds/', practiceUrl: 'https://corbettmaths.com/2019/08/29/surds-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/surds-pdf1.pdf' },
      { id: 'num-10', title: 'BODMAS', videoUrl: 'http://corbettmaths.com/2013/06/08/order-of-operations/', practiceUrl: 'https://corbettmaths.com/2019/09/02/order-of-operations-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2018/11/Order-of-Operations-Exercise-211-pdf.pdf' },
    ],
  },
  {
    key: 'geometry',
    label: 'Geometry',
    emoji: '📐',
    color: '#F59E0B',
    topics: [
      { id: 'geo-01', title: 'Pythagoras', videoUrl: 'http://corbettmaths.com/2012/08/19/pythagoras-video/', practiceUrl: 'https://corbettmaths.com/2019/09/02/pythagoras-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2019/02/Pythagoras-pdf.pdf' },
      { id: 'geo-02', title: 'Trigonometry: Missing Sides', videoUrl: 'http://corbettmaths.com/2013/03/30/trigonometry-missing-sides/', practiceUrl: 'https://corbettmaths.com/2019/08/29/trigonometry-practice-questions/' },
      { id: 'geo-03', title: 'Trigonometry: Missing Angles', videoUrl: 'http://corbettmaths.com/2013/03/30/trigonometry-missing-angles/', practiceUrl: 'https://corbettmaths.com/2019/08/29/trigonometry-practice-questions/' },
      { id: 'geo-04', title: 'Sine Rule', videoUrl: 'http://corbettmaths.com/2013/05/03/sine-rule-missing-sides/', practiceUrl: 'https://corbettmaths.com/2019/09/09/sine-rule-and-cosine-rule-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2018/09/Sine-Rule-pdf.pdf' },
      { id: 'geo-05', title: 'Cosine Rule', videoUrl: 'http://corbettmaths.com/2013/04/04/cosine-rule-missing-sides/', practiceUrl: 'https://corbettmaths.com/2019/09/09/sine-rule-and-cosine-rule-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2019/07/Cosine-Rule-pdf.pdf' },
      { id: 'geo-06', title: 'Circle Theorems', videoUrl: 'http://corbettmaths.com/2013/04/04/circle-theorems-theorems/', practiceUrl: 'https://corbettmaths.com/2018/04/04/circle-theorems-2/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2018/09/Circle-Theorems-pdf.pdf' },
      { id: 'geo-07', title: 'Angles in Parallel Lines', videoUrl: 'http://corbettmaths.com/2013/04/04/parallel-lines-angles/', practiceUrl: 'https://corbettmaths.com/2018/04/04/angles-in-parallel-lines/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/angles-in-parallel-lines-pdf1.pdf' },
      { id: 'geo-08', title: 'Angles in Polygons', videoUrl: 'http://corbettmaths.com/2012/08/10/angles-in-polygons/', practiceUrl: 'https://corbettmaths.com/2018/04/04/angles-in-polygons-2/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/angles-in-polygons-pdf2.pdf' },
      { id: 'geo-09', title: 'Bearings', videoUrl: 'http://corbettmaths.com/2013/03/27/bearings/', practiceUrl: 'https://corbettmaths.com/2018/04/04/bearings-2/' },
      { id: 'geo-10', title: 'Vectors', videoUrl: 'https://corbettmaths.com/2016/04/25/vectors/', practiceUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/vectors-pdf.pdf' },
    ],
  },
  {
    key: 'area-volume',
    label: 'Area & Volume',
    emoji: '📦',
    color: '#EF4444',
    topics: [
      { id: 'av-01', title: 'Area of a Circle', videoUrl: 'http://corbettmaths.com/2013/12/22/area-of-a-circle-video-40-and-59/', practiceUrl: 'https://corbettmaths.com/2018/04/04/area-of-a-circle/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2017/12/area-of-a-circle.pdf' },
      { id: 'av-02', title: 'Area of a Trapezium', videoUrl: 'http://corbettmaths.com/2012/08/02/area-of-a-trapezium-video/', practiceUrl: 'https://corbettmaths.com/2018/04/04/area-of-a-trapezium/' },
      { id: 'av-03', title: 'Area of a Sector', videoUrl: 'http://corbettmaths.com/2012/08/02/area-of-a-sector-video/', practiceUrl: 'https://corbettmaths.com/2018/04/04/area-of-a-sector/' },
      { id: 'av-04', title: 'Volume of a Prism', videoUrl: 'http://corbettmaths.com/2013/04/20/volume-of-a-prism/', practiceUrl: 'https://corbettmaths.com/2019/09/09/volume-of-a-prism-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/volume-of-a-prism-pdf1.pdf' },
      { id: 'av-05', title: 'Volume of a Cylinder', videoUrl: 'http://corbettmaths.com/2013/02/15/volume-of-a-cylinder/', practiceUrl: 'https://corbettmaths.com/2019/09/09/volume-of-a-cylinder-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/volume-of-a-cylinder-pdf1.pdf' },
      { id: 'av-06', title: 'Volume of a Cone', videoUrl: 'http://corbettmaths.com/2013/03/03/volume-of-a-cone/', practiceUrl: 'https://corbettmaths.com/2019/09/09/volume-of-a-cone-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/volume-of-a-cone-pdf2.pdf' },
      { id: 'av-07', title: 'Volume of a Sphere', videoUrl: 'http://corbettmaths.com/2013/03/03/volume-of-a-sphere/', practiceUrl: 'https://corbettmaths.com/2019/09/09/volume-of-a-sphere-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/volume-of-a-sphere-pdf1.pdf' },
      { id: 'av-08', title: 'Surface Area: Cuboid', videoUrl: 'http://corbettmaths.com/2013/03/29/surface-area-of-a-cuboid/', practiceUrl: 'https://corbettmaths.com/2019/09/05/surface-area-of-cubes-and-cuboids-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/surface-area-cuboids-pdf.pdf' },
    ],
  },
  {
    key: 'graphs',
    label: 'Graphs',
    emoji: '📈',
    color: '#06B6D4',
    topics: [
      { id: 'grp-01', title: 'Linear Graphs: y=mx+c', videoUrl: 'http://corbettmaths.com/2013/05/29/ymxc/', practiceUrl: 'https://corbettmaths.com/2019/08/29/equation-of-a-line-practice-questions/' },
      { id: 'grp-02', title: 'Gradient of a Line', videoUrl: 'http://corbettmaths.com/2013/05/15/gradient-of-a-line/', practiceUrl: 'https://corbettmaths.com/2019/09/02/gradient-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2018/12/Gradient-pdf.pdf' },
      { id: 'grp-03', title: 'Parallel & Perpendicular Lines', videoUrl: 'http://corbettmaths.com/2013/06/06/graphs-parallel-lines/', practiceUrl: 'https://corbettmaths.com/2018/04/25/parallel-line-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/parallel-and-perpendicular-graphs-pdf.pdf' },
      { id: 'grp-04', title: 'Drawing Quadratics', videoUrl: 'http://corbettmaths.com/2013/06/23/drawing-quadratics/', practiceUrl: 'https://corbettmaths.com/2019/09/05/drawing-quadratics-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2019/06/Drawing-Quadratics.pdf' },
      { id: 'grp-05', title: 'Distance-Time Graphs', videoUrl: 'http://corbettmaths.com/2013/05/25/travel-graphs/', practiceUrl: 'https://corbettmaths.com/2019/09/02/distance-time-graphs/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/distance-time-graphs-pdf.pdf' },
      { id: 'grp-06', title: 'Transformations of Graphs', videoUrl: 'https://corbettmaths.com/2016/08/07/transformations-of-graphs/', practiceUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/transformations-of-graphs-pdf1.pdf' },
    ],
  },
  {
    key: 'probability-stats',
    label: 'Probability & Stats',
    emoji: '🎲',
    color: '#EC4899',
    topics: [
      { id: 'ps-01', title: 'Basic Probability', videoUrl: 'http://corbettmaths.com/2013/06/15/probability/', practiceUrl: 'https://corbettmaths.com/2019/09/02/probability-practice-questions/' },
      { id: 'ps-02', title: 'Tree Diagrams', videoUrl: 'http://corbettmaths.com/2013/05/07/tree-diagrams/', practiceUrl: 'https://corbettmaths.com/2019/09/05/tree-diagrams-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2019/04/Tree-Diagrams.pdf' },
      { id: 'ps-03', title: 'Venn Diagrams', videoUrl: 'https://corbettmaths.com/2016/08/07/venn-diagrams/', practiceUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/venn-diagrams-pdf.pdf' },
      { id: 'ps-04', title: 'Averages: Mean', videoUrl: 'http://corbettmaths.com/2012/08/02/the-mean/', practiceUrl: 'https://corbettmaths.com/2019/08/28/mean-mode-median-range-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/averages-and-range-pdf2.pdf' },
      { id: 'ps-05', title: 'Cumulative Frequency', videoUrl: 'http://corbettmaths.com/2012/08/09/drawing-cumulative-frequency-graphs/', practiceUrl: 'https://corbettmaths.com/2019/09/02/cumulative-frequency-and-box-plot-practice-questions/' },
      { id: 'ps-06', title: 'Histograms', videoUrl: 'http://corbettmaths.com/2012/08/20/drawing-histograms/', practiceUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/histograms-pdf2.pdf' },
    ],
  },
  {
    key: 'transformations',
    label: 'Transformations',
    emoji: '🔄',
    color: '#8B5CF6',
    topics: [
      { id: 'tr-01', title: 'Reflections', videoUrl: 'http://corbettmaths.com/2012/08/19/reflections/', practiceUrl: 'https://corbettmaths.com/2019/08/29/reflections-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/reflections-pdf1.pdf' },
      { id: 'tr-02', title: 'Rotations', videoUrl: 'http://corbettmaths.com/2013/05/19/rotations/', practiceUrl: 'https://corbettmaths.com/2019/09/02/rotations-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/rotations.pdf' },
      { id: 'tr-03', title: 'Translations', videoUrl: 'http://corbettmaths.com/2012/08/10/transformations-translations/', practiceUrl: 'https://corbettmaths.com/2019/09/06/translations-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/translations-pdf1.pdf' },
      { id: 'tr-04', title: 'Enlargements', videoUrl: 'http://corbettmaths.com/2012/08/19/enlargements/', practiceUrl: 'https://corbettmaths.com/2019/08/28/enlargements-practice-questions/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2019/01/Enlargements-pdf.pdf' },
      { id: 'tr-05', title: 'Similar Shapes', videoUrl: 'http://corbettmaths.com/2013/11/16/similarshapes/', practiceUrl: 'https://corbettmaths.com/wp-content/uploads/2013/02/similar-shapes-pdf.pdf' },
      { id: 'tr-06', title: 'Congruent Triangles', videoUrl: 'http://corbettmaths.com/2013/04/15/congruent-triangles/', practiceUrl: 'https://corbettmaths.com/2018/04/04/congruent-triangles-2/', textbookUrl: 'https://corbettmaths.com/wp-content/uploads/2019/02/Congruent-Triangles-pdf.pdf' },
    ],
  },
];

export const FIVE_A_DAY_URLS = {
  gcse: 'https://corbettmaths.com/5-a-day/gcse/',
  primary: 'https://corbettmaths.com/5-a-day/primary/',
  furtherMaths: 'https://corbettmaths.com/5-a-day/further-maths/',
};

export const REVISION_URLS = {
  gcse: 'https://corbettmaths.com/2023/08/01/gcse-revision/',
  furtherMaths: 'https://corbettmaths.com/further-maths/',
  revisionCards: 'https://corbettmaths.com/revision-cards/',
  books: 'https://corbettmaths.com/books/',
};

export default CORBETT_MATHS;
