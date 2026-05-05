const sampleDocuments = [
  {
    title: "Machine Learning Notes",
    sourceType: "sample",
    pages: [
      {
        pageNumber: 1,
        text: "Machine learning is a field of artificial intelligence focused on algorithms that improve from data. Supervised learning uses labelled examples to learn a relationship between inputs and outputs. Common supervised learning tasks include classification, where the output is a category, and regression, where the output is numeric. Model evaluation often uses train test splits, cross validation, accuracy, precision, recall, F1 score, mean squared error, and confusion matrices."
      },
      {
        pageNumber: 2,
        text: "Overfitting happens when a model memorizes training examples instead of learning general patterns. Regularization, simpler models, more data, feature selection, and validation sets can reduce overfitting. Underfitting happens when the model is too simple to capture the pattern. The bias variance tradeoff explains the balance between a model being too rigid and too sensitive to noise."
      }
    ]
  },
  {
    title: "Cybersecurity Fundamentals",
    sourceType: "sample",
    pages: [
      {
        pageNumber: 1,
        text: "Cybersecurity protects systems, networks, software, and data from unauthorized access, misuse, disruption, or destruction. The CIA triad stands for confidentiality, integrity, and availability. Confidentiality means only authorized users can access information. Integrity means data remains accurate and untampered. Availability means systems and data are accessible when needed."
      },
      {
        pageNumber: 2,
        text: "Common security controls include authentication, authorization, encryption, logging, network segmentation, firewalls, backups, and incident response plans. Multi factor authentication reduces account takeover risk. Security monitoring helps detect suspicious activity. Least privilege limits users to only the access required for their tasks."
      }
    ]
  },
  {
    title: "Data Structures Review",
    sourceType: "sample",
    pages: [
      {
        pageNumber: 1,
        text: "A data structure organizes data so programs can access and modify it efficiently. Arrays provide constant time indexing but fixed size storage in many languages. Linked lists support efficient insertion and deletion when a node reference is known, but searching requires linear time. Stacks follow last in first out behavior. Queues follow first in first out behavior."
      },
      {
        pageNumber: 2,
        text: "Hash tables store key value pairs and often provide average constant time lookup, insertion, and deletion. Trees represent hierarchical data. Binary search trees support ordered operations when balanced. Graphs model relationships between entities using vertices and edges. Algorithms such as breadth first search and depth first search explore graph structures."
      }
    ]
  }
]

module.exports = { sampleDocuments }
