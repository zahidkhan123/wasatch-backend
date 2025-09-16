import { IProperty, Property } from "../../models/admin/property.model.js";

export const createPropertyService = async (
  data: Partial<IProperty>,
  adminId: string
) => {
  try {
    console.log(data);
    const property = new Property({
      ...data,
      createdBy: adminId,
    });
    await property.save();

    return {
      message: "Property created successfully.",
      statusCode: 201,
      success: true,
      data: property,
    };
  } catch (error: any) {
    console.log(error);
    if (error.code === 11000) {
      if (error.keyValue.accessCode) {
        return {
          message: "Access code already exists.",
          statusCode: 400,
          success: false,
        };
      }
    }
    return {
      message: error.message || "Failed to create property.",
      statusCode: 400,
      success: false,
    };
  }
};

export const getPropertiesService = async () => {
  try {
    // Fetch properties sorted by creation date descending (latest first)
    const properties = await Property.find().sort({ createdAt: -1 });
    if (!properties || properties.length === 0) {
      return {
        message: "No properties found.",
        statusCode: 404,
        success: false,
      };
    }

    return {
      message: "Properties fetched successfully.",
      statusCode: 200,
      success: true,
      data: properties,
    };
  } catch (error: any) {
    return {
      message: error.message || "Failed to fetch properties.",
      statusCode: 400,
      success: false,
    };
  }
};

export const getPropertyByIdService = async (id: string) => {
  try {
    const property = await Property.findById(id);
    if (!property) {
      return {
        message: "Property not found.",
        statusCode: 404,
        success: false,
      };
    }
    return {
      message: "Property fetched successfully.",
      statusCode: 200,
      success: true,
      data: property,
    };
  } catch (error: any) {
    return {
      message: error.message || "Failed to fetch property.",
      statusCode: 400,
      success: false,
    };
  }
};

export const updatePropertyService = async (
  id: string,
  data: Partial<IProperty>
) => {
  try {
    const property = await Property.findById(id);
    if (!property) {
      return {
        message: "Property not found.",
        statusCode: 404,
        success: false,
      };
    }
    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    return {
      message: "Property updated successfully.",
      statusCode: 200,
      success: true,
      data: updatedProperty,
    };
  } catch (error: any) {
    return {
      message: error.message || "Failed to update property.",
      statusCode: 400,
      success: false,
    };
  }
};

export const deletePropertyService = async (id: string) => {
  try {
    const property = await Property.findById(id);
    if (!property) {
      return {
        message: "Property not found.",
        statusCode: 404,
        success: false,
      };
    }

    // Delete the property
    await Property.findByIdAndDelete(id);

    return {
      message: "Property deleted successfully.",
      statusCode: 200,
      success: true,
      data: null,
    };
  } catch (error: any) {
    console.log(error);
    return {
      message: error.message || "Failed to delete property.",
      statusCode: 400,
      success: false,
    };
  }
};
