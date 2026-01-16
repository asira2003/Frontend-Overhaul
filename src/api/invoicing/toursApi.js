export async function searchTours(
  searchBy,
  searchValue,
  sortType,
  sortOrder,
  filterValue
) {
  return {
    tourStatuses: [
      { id: "PWE-1", description: "PENDING" },
      { id: "PWE-2", description: "COMPLETE" },
      { id: "PWE-3", description: "CANCELLED" },
    ],
    pagination: {
      page: 1,
      count: 3,
    },
    tours: [
      {
        tourId: "PWE-2023-0001",
        invoicedDate: "2023-05-01",
        title: "Deluxe",
        pricing: "30000.00",
        status: "PWE-1",
        description: "Lorem ipsum ...",
        payements: [],
      },
      {
        tourId: "PWE-2023-0002",
        invoicedDate: "2023-05-01",
        title: "ABZ",
        pricing: "30000.00",
        status: "PWE-2",
        description: "Lorem ipsum ...",
        payements: [],
      },
      {
        tourId: "PWE-2023-0003",
        invoicedDate: "2023-05-01",
        title: "Asira",
        pricing: "30000.00",
        status: "PWE-3",
        description: "Lorem ipsum ...",
        payements: [],
      },

      {
        tourId: "PWE-2023-0004",
        invoicedDate: "2023-05-01",
        title: "Asira",
        pricing: "30000.00",
        status: "PWE-1",
        description:
          " ",
      },
    ],
  };
}
